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
          author
      }
  }
`