import React, { useState, useEffect } from 'react';
import './App.css';
import {Button, Pagination} from 'react-bootstrap';
import {Navbar, Form, FormControl, Dropdown, DropdownButton, ListGroup, Container, Row, Col} from 'react-bootstrap';
import { useHistory, useParams } from "react-router-dom";
import {ImSortAlphaDesc, ImSortAlphaAsc} from "react-icons/im";
import 'bootstrap/dist/css/bootstrap.min.css';
import { useHistoryState } from "./HistoryState";
import {db, setDB, isDBCached} from "./IndexedDB/IndexedDB"
import API from 'api'
import { RiContactsBookLine } from 'react-icons/ri';

export function Entities(){
  const history = useHistory();

  let { dataset, explanation } = useParams();

  const [entities, setEntities] = useState(null);
  const [types, setTypes] = useState(null);

  const [asc, setAsc] = useHistoryState("asc", true);
  const [active, setActive] = useHistoryState("active", 0);
  const [searchTerm, setSearchTerm] = useHistoryState("searchTerm", "");
  const [selectedType, setSelectedType] = useHistoryState('selectedType', 'All types');

  const [pageSize, setPageSize] = useState(50);
  const [skip, setSkip] = useState(2);

  useEffect(() => {
    db.types.toArray().then((arr) => {
      setTypes(arr);
    });
    isDBCached(dataset, explanation).then((itIs) => {
      if(!itIs){
        console.log(dataset + "_" + explanation + " not cached loading")
        API.getAllTestEntities(dataset, explanation, (entities) => {
          setDB(entities["entities"], entities["types"], dataset, explanation).then(() => {
            setAsc(true);
          })
        });
      } else {
        console.log(dataset + "_" + explanation + " cached")
      }
    });
  }, []);

  useEffect(() => {
    sort()
  }, [asc]);

  function toggle_sort(){
    setAsc(!asc)
  }

  function sort(){
    console.log("sort")
    let sort = null;
    if(asc){
      sort = db.entities.toCollection().sortBy("label")
    } else {
      sort = db.entities.toCollection().reverse().sortBy("label")
    }
    sort.then((sorted) => {
      setEntities(sorted)
    })
  }

  function filter_search(arr){
    return arr.filter(entity => (
      (
        searchTerm === "" 
        || entity.id.toLowerCase().includes(searchTerm.toLowerCase()) 
        || (entity.label != null && entity.label.toLowerCase().includes(searchTerm.toLowerCase())
      )) && (
        selectedType === "All types"
        || entity.types.includes(selectedType)
      )))
  }

  return (
    <div style={{minHeight: "100vh"}}>
        <Navbar bg="dark" variant="dark">
          <Form inline>
            <Button variant="outline-success" className="mr-sm-2" onClick={() => toggle_sort()}>
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
                  <Dropdown.Item eventKey={type.label} onSelect={(e) => { setSelectedType(type.label) }}>{type.label}</Dropdown.Item>
                ) : ""}
              </Dropdown.Menu>
            </Dropdown>
            <FormControl type="text" placeholder="Quicksearch" value={searchTerm} onChange = {(e) => editSearchTerm(e.target.value)} className="mr-sm-2" />
          </Form>
        </Navbar>
        {entities ? renderPagination(filter_search(entities)) : ""}
    </div>
  );

  function renderPagination(entities_){
    return(
      <>
        <Pagination className="Entities-pagination justify-content-center my-2">{getItems(Math.floor(entities_.length / pageSize))}</Pagination>
        {entities ? renderResult(entities_) : ""}
        <Pagination className="Entities-pagination justify-content-center my-2">{getItems(Math.floor(entities_.length / pageSize))}</Pagination>
      </>
    );
  }

  function renderResult(values) {
    //.filter(row => (this.state.searchTerm === "" || row[0].toLowerCase().includes(this.state.searchTerm.toLowerCase()) || row[2].toLowerCase().includes(this.state.searchTerm.toLowerCase())))
    
    return (
      <Container>
        <Row className="justify-content-md-center">
          <Col xs="auto">
            <ListGroup>
              {values
              .slice(page2idx(active), page2idx(active + 1)).map(row =>
                <ListGroup.Item action as="button" onClick={() => onEntitySelection(row)}>
                    <Container>
                      <Row>
                        <Col className="text-wrap">
                          {row["id"]}
                        </Col>
                        <Col className="text-wrap">
                          {row["label"]}
                        </Col>
                      </Row>
                    </Container>
                </ListGroup.Item>
              )}
            </ListGroup>
          </Col>
        </Row>
      </Container>
    );
  }

  function onEntitySelection(row){
    history.push(`/${dataset}/${explanation}/entity?term=${row["id"]}`);
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
    variant="outline-success"
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