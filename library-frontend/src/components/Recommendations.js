import { useQuery, useLazyQuery } from '@apollo/client'
import React, { useEffect } from 'react'
import { GET_USER, ALL_BOOKS} from '../queries'

const Recommendations = ({show}) => {

    const result = useQuery(GET_USER)
    const favoriteGenre = result?.data?.me?.favoriteGenre
    const bookResult = useQuery(ALL_BOOKS, { variables: { genre: favoriteGenre}})

    if(!show) {
        return null
    }

    if(result.loading || bookResult.loading) {
        return(<div>loading...</div>)
    }

    const books = bookResult.data.allBooks

    return(
        <div>
            <h2>recommendations</h2>
            <div>your favorite genre: <b>{favoriteGenre}</b></div>

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
        </div>
    )
}

export default Recommendations