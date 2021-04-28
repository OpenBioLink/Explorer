import React, { useState, useEffect } from 'react';
import './App.css';
import {Button, Pagination} from 'react-bootstrap';
import {Navbar, Form, FormControl, Dropdown, DropdownButton, ListGroup, Container, Row, Col} from 'react-bootstrap';
import { useHistory } from "react-router-dom";
import {ImSortAlphaDesc, ImSortAlphaAsc} from "react-icons/im";
import 'bootstrap/dist/css/bootstrap.min.css';
import { useHistoryState } from "./HistoryState";
import Cookies from 'universal-cookie';
import {tic, toc, sortAsc, sortDesc} from './util'
const cookies = new Cookies();
const API = require('./API');

export function Entities(){
  const history = useHistory();
  const [entities, setEntities] = useHistoryState("entities", null);
  const [types, setTypes] = useHistoryState("types", null);
  const [asc, setAsc] = useHistoryState("asc", null);

  const [pageSize, setPageSize] = useState(50);
  const [active, setActive] = useHistoryState("active", 0);
  const [skip, setSkip] = useState(2);
  const [selectedType, setSelectedType] = useState('All types');
  const [searchTerm, setSearchTerm] = useHistoryState("searchTerm", "");

  useEffect(() => {
    if(entities == null){
      query_entities();
    }
  }, []);


  function setEntityState(entities, types, asc){
    setTypes(types);
    setEntities(entities);
    setAsc(asc);
  }

  function sort(){
      var entities_ = [...entities];
      if(asc === true){
        setEntityState(sortDesc(entities_), false);
      } else {
        setEntityState(sortAsc(entities_), true);
      }
    }

  function query_entities(){
    API.getAllTestEntities(cookies.get('datasetID'), cookies.get('explanationID'), (data) => {
      setEntityState(sortAsc(data["entities"]), data["types"], true);
    });
  }

  return (
    <div style={{minHeight: "100vh"}}>
        <Navbar bg="dark" variant="dark">
          <Form inline>
            <Button variant="outline-info" className="mr-sm-2" onClick={() => sort()}>
              {asc ? 
                <ImSortAlphaAsc/> :
                <ImSortAlphaDesc/>
              }
            </Button>
            <Dropdown className="mr-sm-2">
              <Dropdown.Toggle as={CustomToggle} id="dropdown-custom-components">
                {selectedType}
              </Dropdown.Toggle>

              <Dropdown.Menu as={CustomMenu}>
                <Dropdown.Item eventKey="All types" onSelect={(e) => { setSelectedType('All types') }}>All types</Dropdown.Item>
                {types ? types.map((type) => 
                  <Dropdown.Item eventKey={type} onSelect={(e) => { setSelectedType(type) }}>{type}</Dropdown.Item>
                ) : ""}
              </Dropdown.Menu>
            </Dropdown>
            <FormControl type="text" placeholder="Quicksearch" value={searchTerm} onChange = {(e) => editSearchTerm(e.target.value)} className="mr-sm-2" />
          </Form>
        </Navbar>
        {entities ? renderPagination(entities.filter(row => (
                (
                  searchTerm === "" 
                  || row["NAME"].toLowerCase().includes(searchTerm.toLowerCase()) 
                  || (row["Label"] != null && row["Label"].toLowerCase().includes(searchTerm.toLowerCase())
                )) && (
                  selectedType === "All types"
                  || row["Types"].includes(selectedType)
                )))) : ""}
    </div>
  );

  function renderPagination(entities){
    return(
      <>
        <Pagination className="Entities-pagination justify-content-center my-2">{getItems(Math.floor(entities.length / pageSize))}</Pagination>
        {entities ? renderResult(entities) : ""}
        <Pagination className="Entities-pagination justify-content-center my-2">{getItems(Math.floor(entities.length / pageSize))}</Pagination>
      </>
    );
  }

  function renderResult(values) {
    //.filter(row => (this.state.searchTerm === "" || row[0].toLowerCase().includes(this.state.searchTerm.toLowerCase()) || row[2].toLowerCase().includes(this.state.searchTerm.toLowerCase())))
    
    return (
      <Container fluid>
        <Row>
          <Col/>
          <Col>
            <ListGroup>
              {values
              .slice(page2idx(active), page2idx(active + 1)).map(row =>
                <ListGroup.Item action as="button" eventKey={row["ID"]} onClick={() => onEntitySelection(row)}>
                    <Container>
                      <Row>
                        <Col className="text-wrap">
                          {row["NAME"]}
                        </Col>
                        <Col className="text-wrap">
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
    history.push("/entity?term=" + row["NAME"]);
  }

  function editSearchTerm(term){
    setActive(0);
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

  function onNextPage(total){
    if(active < total){
      setActive(active + 1);
    }
  }

  function onLastPage(total){
    setActive(total);
  }

  function getItems(total){
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
      <Pagination.Next onClick={() => onNextPage(total)}/>
      );
    items.push(
      <Pagination.Last onClick={() => onLastPage(total)}/>
    );
    return items;
  }

  function page2idx(page){
    return page * pageSize;
  }
}

const CustomToggle = React.forwardRef(({ children, onClick }, ref) => (
  <Button
    className="dropdown-toggle"
    onClick={(e) => {
      e.preventDefault();
      onClick(e);
    }}
  >
    {children}
  </Button>
));

// forwardRef again here!
// Dropdown needs access to the DOM of the Menu to measure it
const CustomMenu = React.forwardRef(
  ({ children, style, className, 'aria-labelledby': labeledBy }, ref) => {
    const [value, setValue] = useState('');

    return (
      <div
        ref={ref}
        style={style}
        className={className}
        aria-labelledby={labeledBy}
      >
        <FormControl
          autoFocus
          className="mx-3 my-2 w-auto"
          placeholder="Type to filter..."
          onChange={(e) => setValue(e.target.value)}
          value={value}
        />
        <ul className="list-unstyled" style={{maxHeight: "50vh", overflow:"auto"}}>
          {React.Children.toArray(children).filter(
            (child) =>
              !value || child.props.children.toLowerCase().startsWith(value),
          )}
        </ul>
      </div>
    );
  },
);