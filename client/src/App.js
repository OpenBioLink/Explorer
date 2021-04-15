import React, { useContext, createContext, useState, useEffect } from 'react';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import {Loader} from './Loader.js'
import {Entities} from './Entities'
import {Start} from './Start'
import {Task} from './Task'
import {Explaination} from './Explaination'
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect
} from "react-router-dom";
import {Button, Navbar, Nav, Form, FormControl} from 'react-bootstrap';
import { Entity } from './Entity';
import Cookies from 'universal-cookie';
 
const cookies = new Cookies()

class App extends React.Component{

  constructor(){
    super();
    this.state = {
      showLoader: true
    }
  }

  render(){
    return (
      <div className="App">
        <ProvideLoaderContext>
          <Router>
            <Header/>  
            <Switch>               
              <Route path='/loader'>
                <Loader cookies={cookies}/>
              </Route>   
              <LoaderRoute path='/entities'>
                <Entities/>
              </LoaderRoute>
              <LoaderRoute path='/entity'>
                <Entity/>
              </LoaderRoute>
              <LoaderRoute path='/task'>
                <Task/>
              </LoaderRoute>
              <LoaderRoute path='/explaination'>
                <Explaination/>
              </LoaderRoute>
              <LoaderRoute path='/'>
                <Start/>
              </LoaderRoute>           
            </Switch>
          </Router>
        </ProvideLoaderContext>
      </div>
    );
  }
}

class Header extends React.Component{
  render(){
    /*   
    <Form inline>
    <FormControl type="text" placeholder="Search" className="mr-sm-2" />
    <Button variant="outline-info">Quicksearch</Button>
    <Button variant="outline-info">Advanced</Button>
    </Form>
    */
    return(
      <header className="App-header">
        <Navbar bg="dark" variant="dark">
            <Navbar.Brand href="/start">Explorer</Navbar.Brand>
            <Nav className="mr-auto">
              {window.DB?
                <Nav.Link href="/entities">Explain</Nav.Link> :
                <Nav.Link href="/loader">Explain</Nav.Link>
              }
              <Nav.Link href="/graph">Graph</Nav.Link>
            </Nav>
          </Navbar>
      </header>
    );
  }
}

const loaderContext = createContext();

function ProvideLoaderContext({ children }) {
  const auth = useProvideLoaderContext();
  return (
    <loaderContext.Provider value={auth}>
      {children}
    </loaderContext.Provider>
  );
}

function useLoaderContext() {
  return useContext(loaderContext);
}

function useProvideLoaderContext() {

  const getExplainationID = () => {
    return cookies.get("explainationID");
  };

  return {
    getExplainationID
  };
}

function LoaderRoute({ children, ...rest }) {
  let ctxt = useLoaderContext();
  return (
    <Route
      {...rest}
      render={({ location }) =>
        ctxt.getExplainationID() ? (
          children
        ) : (
          <Redirect
            to={{
              pathname: "/loader",
              state: { from: location }
            }}
          />
        )
      }
    />
  );
}


export default App;
