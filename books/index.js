require('dotenv').config()
const { ApolloServer, gql, UserInputError } = require('apollo-server')
const { v4 } = require('uuid')
const mongoose = require('mongoose')

const Author = require('./models/author')
const Book = require('./models/book')

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
      addBook: async (root, args) => {
          const book = new Book({ ...args })

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
      editAuthor: async (root, args) => {
          const author = await Author.findOneAndUpdate({ name: args.name }, { born: args.setBornTo}, { new: true})
            .catch( (error) => {
              throw new UserInputError(error.message, {
                invalidArgs: args,
              })
            })
          return author
      }
  }
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
})

server.listen().then(({ url }) => {
  console.log(`Server ready at ${url}`)
})