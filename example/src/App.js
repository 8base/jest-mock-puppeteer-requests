import React from 'react';
import { useQuery } from 'react-apollo';
import { gql } from 'apollo-boost';
import logo from './logo.svg';
import './App.css';

function App() {
  const { data, loading } = useQuery(gql`query { companyName }`);

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <div>{data ? data.companyName : loading }</div>
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
