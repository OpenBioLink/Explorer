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
import { Overview } from './Overview';
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
          <Header path='/:dataset/:explanation/*'/>  
          <Switch>               
            <Route path='/loader'>
              <Loader cookies={cookies}/>
            </Route>   
            <Route path='/:dataset/:explanation/entities'>
              <Entities/>
            </Route>
            <Route path='/:dataset/:explanation/entity'>
              <Entity/>
            </Route>
            <Route path='/:dataset/:explanation/task'>
              <Task/>
            </Route>
            <Route path='/:dataset/:explanation/explanation'>
              <Explanation/>
            </Route>
            <Route path='/:dataset/:explanation/overview'>
              <Overview/>
            </Route> 
            <Route path={['/:dataset/:explanation/feedback', '/feedback']}>
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

  const [dataset, setDataset] = useState(null);
  const [explanation, setExplanation] = useState(null);

  useEffect(() => {
    const match = matchPath(location.pathname, {
      path: '/:dataset/:explanation/*',
      exact: true,
      strict: false
    });
    if(match){
      setDataset(match.params.dataset);
      setExplanation(match.params.explanation);
    }
  }, [location]);

  function onLoadOther(){
    history.push(`/loader`);
  }

  function onClickLink(e){
    e.preventDefault();
    if(e.target.nodeName != "A"){
      history.push(e.target.parentNode.attributes.href.value);
    } else {
      history.push(e.target.attributes.href.value);
    }
  }

  return(
    <header className="App-header">
      <Navbar bg="dark" variant="dark">
          <Navbar.Brand href={(dataset && explanation) ? `/${dataset}/${explanation}/entities` : "/loader"} onClick={(e) => onClickLink(e)}>
          <img
            alt=""
            src="/favicon.svg"
            width="40"
            height="40"
            className="d-inline-block align-top"
          />{' '}
          <span className="d-inline-block align-middle">
            LinkExplorer
          </span>
          </Navbar.Brand>
          <Nav className="mr-auto" defaultActiveKey={location.pathname}>
            <Nav.Link href={`/${dataset}/${explanation}/overview`} disabled={!dataset || !explanation} onClick={(e) => onClickLink(e)}>Overview</Nav.Link>
            <Nav.Link href={`/${dataset}/${explanation}/entities`} disabled={!dataset || !explanation} onClick={(e) => onClickLink(e)}>Entities</Nav.Link>
            <Nav.Link href={(dataset && explanation) ? `/${dataset}/${explanation}/feedback` : "/feedback"} onClick={(e) => onClickLink(e)}>Feedback</Nav.Link>
          </Nav>
          <Navbar.Collapse className="justify-content-end">
            {(dataset && explanation) ?
            <>
              <Navbar.Text className="mr-2">
                Dataset: {dataset ? dataset : "None"}
              </Navbar.Text>
              <Navbar.Text className="mr-2">
                Explanation: {explanation ? explanation : "None"}
              </Navbar.Text>
            </>
            : "" }
            <Button size="sm" variant="outline-light" onClick={() => onLoadOther()}>
              {(dataset && explanation) ? "Load other" : "Load"}
            </Button>
          </Navbar.Collapse>
          
        </Navbar>
    </header>
  );
}


export default App;
