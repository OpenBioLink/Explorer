import React, { useContext, createContext, useState, useEffect } from 'react';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import PropTypes from "prop-types";
import { withRouter } from "react-router";
import {Loader} from './Loader.js'
import {Entities} from './Entities'
import {Start} from './Start'
import {Task} from './Task'
import {Explanation} from './Explanation'
import { Entity } from './Entity';
import { Feedback } from './Feedback';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect
} from "react-router-dom";
import {Button, Navbar, Nav, Form, FormControl} from 'react-bootstrap';
import Cookies from 'universal-cookie';
 
const cookies = new Cookies()

class App extends React.Component{

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
              <LoaderRoute path='/explanation'>
                <Explanation/>
              </LoaderRoute>
              <Route path='/feedback'>
                <Feedback/>
              </Route> 
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

class Header_ extends React.Component{

  static propTypes = {
    match: PropTypes.object.isRequired,
    location: PropTypes.object.isRequired,
    history: PropTypes.object.isRequired
  };

  constructor(){
    super();
    this.state={
      dataset: "-",
      explanation: "-"
    }
  }

  componentDidMount(){
    var datasetid_ = cookies.get("datasetLabel");
    var explanationid_ = cookies.get("explanationLabel");
    
    if(datasetid_ !== undefined){
      this.setState({dataset: datasetid_});
    }
    if(explanationid_ !== undefined){
      this.setState({explanation: explanationid_});
    }
    cookies.addChangeListener((element) => {
      if(element.name === "datasetLabel"){
        this.setState({dataset: element.value});
      } else if(element.name === "explanationLabel"){
        this.setState({explanation: element.value});
      }
    });
  }

  onLoadOther(){
    this.props.history.push(`/loader`);
  }

  render(){
    return(
      <header className="App-header">
        <Navbar bg="dark" variant="dark">
            <Navbar.Brand href="/entities">
              Explorer (alpha)
            </Navbar.Brand>
            <Nav className="mr-auto">
              <Nav.Link href="/overview">Overview</Nav.Link>
              <Nav.Link href="/entities">Entities</Nav.Link>
              <Nav.Link href="/feedback">Feedback</Nav.Link>
            </Nav>
            <Navbar.Collapse className="justify-content-end">
              <Navbar.Text className="mr-2">
                Dataset: {this.state.dataset}
              </Navbar.Text>
              <Navbar.Text className="mr-2">
                Explanation: {this.state.explanation}
              </Navbar.Text>
              <Button size="sm" variant="outline-success" onClick={() => this.onLoadOther()}>Load other</Button>
            </Navbar.Collapse>
          </Navbar>
      </header>
    );
  }
}
const Header = withRouter(Header_);

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

  const getExplanationID = () => {
    return cookies.get("explanationID");
  };

  return {
    getExplanationID
  };
}

function LoaderRoute({ children, ...rest }) {
  let ctxt = useLoaderContext();
  return (
    <Route
      {...rest}
      render={({ location }) =>
        ctxt.getExplanationID() ? (
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
