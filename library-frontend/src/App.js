import React, { useState } from 'react'
import Authors from './components/Authors'
import Books from './components/Books'
import NewBook from './components/NewBook'
import LoginForm from './components/LoginForm'
import { useApolloClient, useSubscription } from '@apollo/client'
import Recommendations from './components/Recommendations'
import { BOOK_ADDED, ALL_BOOKS } from './queries'

const App = () => {
  const [ token, setToken ] = useState(null)
  const [page, setPage] = useState('authors')
  const client = useApolloClient()

  const includedIn = (set, object) => 
      set.map(p => p.title).includes(object.title)  

  useSubscription(BOOK_ADDED, {
    onSubscriptionData: ({subscriptionData}) => {
      const addedBook = subscriptionData.data.bookAdded
      window.alert(`A new book ${addedBook.title} added`)

      const dataInStore = client.readQuery({ query: ALL_BOOKS })
      if (!includedIn(dataInStore.allBooks, addedBook)) {
        client.writeQuery({
          query: ALL_BOOKS,
          variables: { genre: null },
          data: {
            allBooks: dataInStore.allBooks.concat(addedBook)
          }
        })

        addedBook.genres.forEach(genre => {
          const x = client.readQuery({
            query: ALL_BOOKS,
            variables: { genre: genre }
          })
          if(x) {
            client.writeQuery({
              query: ALL_BOOKS,
              variables: { genre: genre },
              data: { allBooks: x.allBooks.concat(addedBook) }
            })
          }
        })

      }
    }
  })

  const logout = () => {
    setToken(null)
    localStorage.clear()
    client.resetStore()
  }

  if(!token) {
    return(
      <div>
        <div>
          <button onClick={() => setPage('authors')}>authors</button>
          <button onClick={() => setPage('books')}>books</button>
          <button onClick={() => setPage('login')}>login</button>
        </div>

        <Authors
          show={page === 'authors'}
        />

        <Books
          show={page === 'books'}
        />

        <LoginForm
          show={page === 'login'}
          setToken={setToken}
        />

      </div>
    )
  }

  return (
    <div>
      <div>
        <button onClick={() => setPage('authors')}>authors</button>
        <button onClick={() => setPage('books')}>books</button>
        <button onClick={() => setPage('add')}>add book</button>
        <button onClick={() => setPage('recommendations')}>recommend</button>
        <button onClick={logout}>logout</button>
      </div>

      <Authors
        show={page === 'authors'}
      />

      <Books
        show={page === 'books'}
      />

      <NewBook
        show={page === 'add'}
      />

      <Recommendations
       show={page === 'recommendations'}
      />

    </div>
  )
}

export default App