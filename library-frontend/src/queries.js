import { gql  } from '@apollo/client'

export const ALL_AUTHORS = gql`
  query {
      allAuthors {
          name
          born
          bookCount
          id
      }
  }
`

export const ALL_BOOKS = gql`
  query findBooks($author: String, $genre: String) {
      allBooks(author: $author, genre: $genre) {
          title,
          published,
          author {
            name
          }
      }
  }
`

export const ADD_BOOK = gql`
  mutation createBook($title: String!, $author: String!, $published: Int!, $genres: [String!]!){
    addBook(title: $title, author: $author, published: $published, genres: $genres) {
        title,
        published
        author {
          name
        }
        genres
    }
  }
`

export const SET_BORN = gql`
  mutation setBorn($name: String!, $setBornTo: Int!) {
    editAuthor(name: $name, setBornTo: $setBornTo) {
      name
      born
      bookCount
    }
  }
`

export const LOGIN = gql`
  mutation login($username: String!, $password: String!) {
    login(username: $username, password: $password)  {
      value
    }
  }
`