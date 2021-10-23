import { useQuery, useMutation } from '@apollo/client'
import React, { useState} from 'react'
import { ALL_AUTHORS, SET_BORN, ALL_BOOKS } from '../queries'
import SELECT from 'react-select'

const Authors = (props) => {
  const result = useQuery(ALL_AUTHORS)


  const [ name, setName ] = useState('')
  const [ born, setBorn ] = useState('')

  const [ editAuthor ] = useMutation(SET_BORN, {
    refetchQueries: [ {query: ALL_BOOKS }, {query: ALL_AUTHORS}]
  })

  if (!props.show) {
    return null
  }

  if(result.loading) {
    return <div>loading...</div>
  }

  const submit = (event) => {
    event.preventDefault()
    const x = Number(born)
    editAuthor( { variables: { name, setBornTo: x }})

    setName('')
    setBorn('')
  }

  const authors = result.data.allAuthors
  const options = authors.map(a => {
    let x = new Object()
    x.value = a.name
    x.label = a.name
    return x
  })

  
  return (
    <div>
      <h2>authors</h2>
      <table>
        <tbody>
          <tr>
            <th></th>
            <th>
              born
            </th>
            <th>
              books
            </th>
          </tr>
          {authors.map(a =>
            <tr key={a.name}>
              <td>{a.name}</td>
              <td>{a.born}</td>
              <td>{a.bookCount}</td>
            </tr>
          )}
        </tbody>
      </table>

      <h2>Set birthyear </h2>
      <form onSubmit={submit} >
        <SELECT options={options} onChange={(event) => setName(event.value)}/>
        <div>
          born
          <input
            value={born}
            type='number'
            onChange={ ({target}) => setBorn(target.value)}
          />
        </div>
        <button type='submit'>update author</button>
      </form>

    </div>
  )
}

export default Authors
