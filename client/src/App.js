import React, { useContext, createContext, useState, useEffect } from 'react';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import PropTypes from "prop-types";
import { useHistory, withRouter, useLocation } from "react-router";
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
import { matchPath } from "react-router";
 
const cookies = new Cookies()

export function App(){

  return (
    <div className="App">
    <Router>
          <Header path='/*/:dataset/:explanation'/>  
          <Switch>               
            <Route path='/loader'>
              <Loader cookies={cookies}/>
            </Route>   
            <Route path='/entities/:dataset/:explanation'>
              <Entities/>
            </Route>
            <Route path='/entity/:dataset/:explanation'>
              <Entity/>
            </Route>
            <Route path='/task/:dataset/:explanation'>
              <Task/>
            </Route>
            <Route path='/explanation/:dataset/:explanation'>
              <Explanation/>
            </Route>
            <Route path='/feedback'>
              <Feedback/>
            </Route> 
            <Route path='/'>
              <Loader cookies={cookies}/>
            </Route>
          </Switch>
      </Router>
    </div>
  );
}



function Header(){

  let location = useLocation();
  const history = useHistory();

  const [dataset, setDataset] = useState("");
  const [explanation, setExplanation] = useState("");

  useEffect(() => {
    const match = matchPath(location.pathname, {
      path: '/*/:dataset/:explanation',
      exact: true,
      strict: false
    });
    if(match){
      setDataset(match.params.dataset);
      setExplanation(match.params.explanation);
    }
  }, [location]);

  /*
  componentDidMount(){



    console.log("HEADER");
    console.log(this.props);

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
  */

  function onLoadOther(){
    history.push(`/loader`);
  }

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
              Dataset: {dataset}
            </Navbar.Text>
            <Navbar.Text className="mr-2">
              Explanation: {explanation}
            </Navbar.Text>
            <Button size="sm" variant="outline-success" onClick={() => onLoadOther()}>Load other</Button>
          </Navbar.Collapse>
        </Navbar>
    </header>
  );
}


export default App;
