import React, { useState, useEffect } from 'react';
import './App.css';
import {Button, Pagination} from 'react-bootstrap';
import {Navbar, Form, FormControl, Dropdown, DropdownButton, ListGroup, Container, Row, Col} from 'react-bootstrap';
import { useHistory } from "react-router-dom";
import {ImSortAlphaDesc, ImSortAlphaAsc} from "react-icons/im";
import 'bootstrap/dist/css/bootstrap.min.css';
import { useHistoryState } from "./HistoryState";
import Cookies from 'universal-cookie';
 
const cookies = new Cookies();
const util = require('./Util');
const API = require('./API');

export function Entities(){
  const history = useHistory();
  const [entities, setEntities] = useHistoryState("entities", null);
  const [asc, setAsc] = useHistoryState("asc", null);
  const [pageSize, setPageSize] = useState(50);
  const [active, setActive] = useState(0);
  const [total, setTotal] = useState(null);
  const [skip, setSkip] = useState(2);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if(entities == null){
      query_entities();
    }
  }, []);


  function setEntityState(entities, asc){
    setEntities(entities);
    setAsc(asc);
  }

  function sort(){
      util.tic();
      var entities_ = [...entities];
      if(asc === true){
        setEntityState(sortDesc(entities_), false);
      } else {
        setEntityState(sortAsc(entities_), true);
      }
      util.toc("sort");
    }

  function sortAsc(entities){
    // Sortieren nach Wert
    return entities.sort((a,b) => {
      var nameA = a["Label"];
      var nameB = b["Label"];

      if(nameA == null && nameB != null){
        return 1;
      }
      else if(nameA != null && nameB == null){
        return -1;
      }
      else if(nameA != null && nameB != null){
        nameA = nameA.toUpperCase();
        nameB = nameB.toUpperCase();
        if (nameA < nameB) {
          return -1;
        }
        else if (nameA > nameB) {
          return 1;
        } else {
          return 0;
        }
      } else {
        return 0;
      }
    });
  }

  function sortDesc(entities){
    return entities.sort((a, b) =>{
      var nameA = a["Label"]; // Groß-/Kleinschreibung ignorieren
      var nameB = b["Label"]; // Groß-/Kleinschreibung ignorieren#

      if(nameA == null && nameB != null){
        return -1;
      }
      else if(nameA != null && nameB == null){
        return 1;
      }
      else if(nameA != null && nameB != null){
        nameA = nameA.toUpperCase();
        nameB = nameB.toUpperCase();
        if (nameA < nameB) {
          return 1;
        }
        else if (nameA > nameB) {
          return -1;
        }
        return 0;
      } else {
        return 0;
      }
    });
  }

  function query_entities(){
    API.getAllTestEntities(cookies.get('datasetID'), (entities) => {
      setTotal(Math.floor(entities.length / pageSize));
      setEntityState(sortAsc(entities), true);
    });
  }

  return (
    <div>
      <pre>
        <Navbar bg="dark" variant="dark">
          <Form inline>
            <Button variant="outline-info" className="mr-sm-2" onClick={() => sort()}>
              {asc ? 
                <ImSortAlphaAsc/> :
                <ImSortAlphaDesc/>
              }
            </Button>
            <DropdownButton id="dropdown-basic-button" title="Category" className="mr-sm-2">
              <Dropdown.Item href="#/action-1">All</Dropdown.Item>
              <Dropdown.Item href="#/action-2">Another action</Dropdown.Item>
              <Dropdown.Item href="#/action-3">Something else</Dropdown.Item>
            </DropdownButton>
            <FormControl type="text" placeholder="Quicksearch" value={searchTerm} onChange = {(e) => editSearchTerm(e.target.value)} className="mr-sm-2" />
          </Form>
        </Navbar>
        <Pagination className="Entities-pagination justify-content-center">{getItems()}</Pagination>
        {entities ? renderResult(entities) : ""}
        <Pagination className="Entities-pagination justify-content-center">{getItems()}</Pagination>
      </pre>
    </div>
  );

  function renderResult(values) {
    //.filter(row => (this.state.searchTerm === "" || row[0].toLowerCase().includes(this.state.searchTerm.toLowerCase()) || row[2].toLowerCase().includes(this.state.searchTerm.toLowerCase())))
    
    return (
      <Container fluid>
        <Row>
          <Col/>
          <Col>
            <ListGroup>
              {values
              .filter(row => (searchTerm === "" 
                || row["NAME"].toLowerCase().includes(searchTerm.toLowerCase()) 
                || (row["Label"] != null && row["Label"].toLowerCase().includes(searchTerm.toLowerCase()))))
              .slice(page2idx(active), page2idx(active + 1)).map(row =>
                <ListGroup.Item action as="button" variant="dark"  eventKey={row["ID"]} onClick={() => onEntitySelection(row)}>
                    <Container>
                      <Row>
                        <Col>
                          {row["NAME"]}
                        </Col>
                        <Col>
                          {row["Label"]}
                        </Col>
                      </Row>
                    </Container>
                </ListGroup.Item>
              )}
            </ListGroup>
          </Col>
          <Col/>
        </Row>
      </Container>
    );
  }

  function onEntitySelection(row){
    history.push("/entity?id=" + row["NAME"]);
  }

  function editSearchTerm(term){
    console.log(term);
    setSearchTerm(term);
  }

  function onPage(e){
    let page = parseInt(e.target.id);
    setActive(page);
  }

  function onFirstPage(){
    setActive(0);
  }

  function onPreviousPage(){
    if(active > 0){
      setActive(active - 1);
    }
  }

  function onNextPage(){
    if(active < total){
      setActive(active + 1);
    }
  }

  function onLastPage(){
    setActive(total);
  }

  function getItems(){
    let items = [];
    items.push(
      <Pagination.First onClick={() => onFirstPage()}/>
    );
    items.push(
      <Pagination.Prev onClick={() => onPreviousPage()}/>
    );

    var start_page = active - skip;
    var stop_page = active + skip;

    if (start_page < 0){
      stop_page = stop_page + Math.abs(start_page) < total ?
                  stop_page + Math.abs(start_page) :
                  total;
      start_page = 0;
    }

    if (stop_page > total){
      start_page = start_page - Math.abs(stop_page - total) > 0 ?
                    start_page - Math.abs(stop_page - total) :
                    0;
      stop_page = total;
    }

    if(start_page > 0){
      items.push(
        <Pagination.Ellipsis disabled={true}/>
      )
    }
    for (let page = start_page; page <= stop_page; page++) {
      items.push(
        <Pagination.Item id={page} key={page} active={page === active} onClick={(event) => onPage(event)}>
          {page+1}
        </Pagination.Item>,
      );
    }
    if(stop_page < total){
      items.push(
        <Pagination.Ellipsis disabled={true}/>
      )
    }
    items.push(
      <Pagination.Next onClick={() => onNextPage()}/>
      );
    items.push(
      <Pagination.Last onClick={() => onLastPage()}/>
    );
    return items;
  }

  function page2idx(page){
    return page * pageSize;
  }
}