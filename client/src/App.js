import React from 'react';
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
  Route
} from "react-router-dom";
import {Button, Navbar, Nav, Form, FormControl} from 'react-bootstrap';
import { Entity } from './Entity';


class App extends React.Component{
  render(){
    return (
      <div className="App">
        <Router> 
          <Header/>  
          <Switch>               
            <Route path='/loader'>
              <Loader/>
            </Route>   
            <Route path='/entities'>
              <Entities/>
            </Route>
            <Route path='/entity'>
              <Entity/>
            </Route>
            <Route path='/task'>
              <Task/>
            </Route>
            <Route path='/explaination'>
              <Explaination/>
            </Route>
            <Route path='/'>
              <Start/>
            </Route>           
          </Switch>
          </Router>
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


export default App;
