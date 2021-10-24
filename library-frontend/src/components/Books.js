import React, { useState, useEffect } from 'react'
import { useLazyQuery, useQuery } from '@apollo/client'
import { ALL_BOOKS, GENRES } from '../queries'

const Books = (props) => {
  //const result = useQuery(ALL_BOOKS)
  const [ getBooks, result ] = useLazyQuery(ALL_BOOKS)
  const [ genre, setGenre ] = useState(null)
  const genreResult = useQuery(GENRES)

  useEffect( () => {
    getBooks({ variables: { genre: genre } })
  }, [genre])

  if (!props.show) {
    return null
  }

  if(result.loading || genreResult.loading) {
    return <div>loading...</div>
  }

  const books = result.data.allBooks

  const genres = genreResult.data.allBooks.map(genre => genre.genres)
  var merged = [... new Set([].concat.apply([], genres))]

  return (
    <div>
      <h2>books</h2>

      <table>
        <tbody>
          <tr>
            <th></th>
            <th>
              author
            </th>
            <th>
              published
            </th>
          </tr>
          {books.map(a =>
            <tr key={a.title}>
              <td>{a.title}</td>
              <td>{a.author.name}</td>
              <td>{a.published}</td>
            </tr>
          )}
        </tbody>
      </table>

      {merged.map( (genre) =>
      
          <button key={genre} onClick={ () => setGenre(genre)}>{genre}</button>
      
      )}
      <button onClick={ () => setGenre(null)}>all genres</button>
    </div>
  )
}

export default Books