require('dotenv').config()
const { ApolloServer, gql, UserInputError, AuthenticationError } = require('apollo-server')
const { v4 } = require('uuid')
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')

const Author = require('./models/author')
const Book = require('./models/book')
const User = require('./models/user')

const JWT_SECRET = process.env.SECRET
const MONGODB_URI = process.env.MONGODB_URI

console.log('connecting to', MONGODB_URI)

mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false, useCreateIndex: true })
  .then(() => {
    console.log('connected to MongoDB')
  })
  .catch((error) => {
    console.log('error connecting to MongoDB:', error.message)
})

const typeDefs = gql`

  type User {
    username: String!
    favoriteGenre: String!
    id: ID!
  }

  type Token {
    value: String!
  }

  type Author {
      name: String!
      id: ID!
      born: String
      bookCount: Int!
  }

  type Book {
    title: String!
    published: Int!
    author: Author!
    genres: [String!]!
    id: ID!
  }

  type Query {
      bookCount: Int!
      authorCount: Int!
      allBooks(author: String, genre: String): [Book!]!
      allAuthors: [Author!]!
      me: User
  }

  type Mutation {
      addBook(
          title: String!
          author: String!
          published: Int!
          genres: [String!]!
      ): Book
      editAuthor(
          name: String!
          setBornTo: Int!
      ): Author
      createUser(
        username: String!
        favoriteGenre: String!
      ): User
      login(
        username: String!
        password: String!
      ): Token
  }
`

const resolvers = {
  Query: {
      bookCount: () => Book.collection.countDocuments(),
      authorCount: () => Author.collection.countDocuments(),
      allBooks: async (root, args) => {
          if(!args.author && !args.genre) {
              return await Book.find({}).populate('author')
          }
          
          //NO genre
          if(!args.genre) {
            
            const books = await Book.find().populate( {
              path: 'author',
              match: { name: `${args.author}` }
            })
            return books.filter( book => book.author)
          } else if(!args.author) { //NO author
              return Book.find({ genres: args.genre }).populate('author')
          } else {
            const books = await Book.find({ genres: args.genre }).populate( {
              path: 'author',
              match: { name: `${args.author}` }
            })
            return books.filter( book => book.author)
          }
          
      },
      allAuthors: async () =>  {
        return await Author.find({})
      },
      me: (root, args, context) => {
        console.log(context)
        return context.currentUser
      }
  },
  Author: {
      bookCount: async (root) => {
        const books = await Book.find().populate( {
          path: 'author',
          match: { name: root.name }
        })
        return books.filter(book => book.author).length
      }
  },
  Mutation: {
      addBook: async (root, args, context) => {
          const book = new Book({ ...args })
          const currentUser = context.currentUser

          if (!currentUser) {
            throw new AuthenticationError("not authenticated")
          }

          //args validation
          if(args.title.length < 4) {
            throw new UserInputError("too short title")
          }

          try {
            let result = await Author.findOne({ name: args.author})

            // result == null only if unknown author
            if(result === null) {

              if(args.author.length < 3) {
                throw new UserInputError("too short author name")
              }

              const author = new Author({ name: args.author, bookCount: 1})
              author.save()
              result = author
            }

            book.author = result._id

            await book.save()
  
            const populatedBook = await Book.findById(book._id).populate('author')
            return populatedBook
          } catch(error) {
            throw new UserInputError(error.message, {
              invalidArgs: args,
            })
          }
      },
      editAuthor: async (root, args, context) => {
          const currentUser = context.currentUser

          if (!currentUser) {
            throw new AuthenticationError("not authenticated")
          }
          const author = await Author.findOneAndUpdate({ name: args.name }, { born: args.setBornTo}, { new: true})
            .catch( (error) => {
              throw new UserInputError(error.message, {
                invalidArgs: args,
              })
            })
          return author
      },

      createUser: (root, args) => {
        const user = new User({ username: args.username, favoriteGenre: args.favoriteGenre })
    
        return user.save()
          .catch(error => {
            throw new UserInputError(error.message, {
              invalidArgs: args,
            })
          })
      },

      login: async (root, args) => {
        const user = await User.findOne({ username: args.username })
    
        if ( !user || args.password !== 'secret' ) {
          throw new UserInputError("wrong credentials")
        }
    
        const userForToken = {
          username: user.username,
          id: user._id,
        }
    
        return { value: jwt.sign(userForToken, JWT_SECRET) }
      },
  }
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: async ({ req }) => {
    const auth = req ? req.headers.authorization : null
    if (auth && auth.toLowerCase().startsWith('bearer ')) {
      const decodedToken = jwt.verify(
        auth.substring(7), JWT_SECRET
      )
      const currentUser = await User.findById(decodedToken.id).populate('friends')
      return { currentUser }
    }
  }
})

server.listen().then(({ url }) => {
  console.log(`Server ready at ${url}`)
})