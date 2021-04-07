import React from 'react';
import './App.css';
import {Button, Pagination} from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import { FaLink } from "react-icons/fa";
import {ImSortAlphaDesc, ImSortAlphaAsc} from "react-icons/im";
const util = require('./Util');

export class Testset extends React.Component{

    constructor(){
      super();
      this.state = {
        triples: null,
        active: 1,
        total: 5
      }
    }
  
    query_testset(options){
      console.log(options);
  
      var sqla = `
      select 
        head.name as head, rel.name as rel, tail.name as tail, head.id as headid, rel.id as relid, tail.id as tailid, triple.id as tripleid
      from 
        triple 
      inner join entity as head 
        on HEAD_ID = head.ID 
      inner join entity as tail 
        on TAIL_ID = tail.ID 
      inner join relation as rel 
        on REL_ID = rel.ID
      `
  
      var sql = `
      select 
        head_id as head, rel_id as rel, tail_id as tail, 0, 0, 0, id as tripleid
      from 
        triple
      limit 100
      `
  
      if(options != null){
        var where = "";
        console.log(where.length);
        if(options.head_hint !== ""){
          where += where.length === 0 ? " WHERE" : " AND";
          where = where + " head LIKE '%" + options.head_hint + "%'";
        }
        if(options.tail_hint !== ""){
          where += where.length === 0 ? " WHERE" : " AND";
          where = where + " tail LIKE '%" + options.tail_hint + "%'";
        }
        if(options.rel_hint !== ""){
          where += where.length === 0 ? " WHERE" : " AND";
          where = where + " rel LIKE '%" + options.rel_hint + "%'";
        }
        sql = sql + where;
    
        if(options.order === 1){
          sql = sql + " ORDER BY " + options.column + " ASC";
        } else if(options.order === 2){
          sql = sql + " ORDER BY " + options.column + " DESC";
        }
      }
      
  
      console.log(sql);
      var result = util.exec(sql);
      console.log(result);
      this.setState({triples: result});
    }
  
    componentDidMount(){
      this.query_testset(null);
    }
  
    paginationClicked(e){
      let page = e.target.textContent;
      if (page === "<"){
         
      } else if (page === "<"){
         
      } else if (page === "<"){
         
      } else if (page === "<"){
         
      }
    }
  
    getItems(){
      let items = [];
  
      items.push(
        <Pagination.First />
      );
  
      items.push(
        <Pagination.Prev />
      );
  
      for (let number = 1; number <= this.state.total; number++) {
        items.push(
          <Pagination.Item key={number} active={number == this.state.active} >
            {number}
          </Pagination.Item>,
        );
      }
  
      items.push(
        <Pagination.Next />
        );
        
      items.push(
        <Pagination.Last />
      );
  
      return items;
    }
  
    render(){
      console.log(this.state.triples);
      return (
        <div>
          <pre>
            <table className="Testset-table">
              <TestsetTableHeader callback={(options) => this.query_testset(options)}/>
              {this.state.triples
              ? this.state.triples.map(this.renderResult, this) // results contains one object per select statement in the query
              : ""
              }
              <Pagination onClick={(event) => this.paginationClicked(event)}>{this.getItems()}</Pagination>
            </table>
          </pre>
          
        </div>
      );
    }
  
    renderResult({ columns, values }) {
      //.filter(row => (this.state.searchTerm === "" || row[0].toLowerCase().includes(this.state.searchTerm.toLowerCase()) || row[2].toLowerCase().includes(this.state.searchTerm.toLowerCase())))
      return (
        
          <tbody>
            {values.map(row =>
              <tr key={row[6]}>
                <td key={row[3]}><Button className='Testset-btn' variant="primary">{row[0]}</Button>{' '}</td>
                <td><Button className='Testset-btn' variant="primary"><FaLink/></Button>{' '}</td>
                <td key={row[4]}><Button className='Testset-btn' variant="primary">{row[1]}</Button>{' '}</td>
                <td><Button className='Testset-btn' variant="primary"><FaLink/></Button>{' '}</td>
                <td key={row[5]}><Button className='Testset-btn' variant="primary">{row[2]}</Button>{' '}</td>
              </tr>
            )}
          </tbody>
      );
    }
  
  }
  
  class TestsetTableHeader extends React.Component{
  
    constructor(props){
      super(props);
  
      // 0 -> nothing, 1 -> ascending, 2 -> descending
      this.state = {order: 0, column: null, head_hint: "", tail_hint: "", rel_hint: ""}
    }
  
    callCallback() {
      console.log(this.state.head_hint);
      this.props.callback(this.state);
    }
  
    sort(col){
      if(this.state.column === col){
        console.log("state is column");
        if(this.state.order === 0){
          this.setState({order:1}, () => {this.callCallback();})
        } else if(this.state.order === 1){
          this.setState({order:2}, () => {this.callCallback();})
        } else if(this.state.order === 2){
          this.setState({order:0}, () => {this.callCallback();})
        }
      } else {
        this.setState({column: col, order:1}, () => {this.callCallback();})
      }
    }
  
    getIcon(column){
      if(this.state.column === column){
        if (this.state.order === 1){
          return(<ImSortAlphaAsc/>);
        } else if(this.state.order === 2){
          return(<ImSortAlphaDesc/>);
        }
      }
    }
  
    editSearchTerm(column, hint){
      console.log(hint);
      if(column === "head"){
        this.setState({head_hint: hint}, () => {this.callCallback();});
      } else if (column === "tail"){
        this.setState({tail_hint: hint}, () => {this.callCallback();});
      }else if (column === "rel"){
        this.setState({rel_hint: hint}, () => {this.callCallback();});
      }
    }
  
    render(){
        return(
          <thead>
            <tr>
              <td className='Testset-cell'><input className='Testset-btn' type='text' value = {this.state.head_hint} onChange = {(e) => this.editSearchTerm("head", e.target.value)} placeholder = 'Search for an entity'/></td>
              <td></td>
              <td className='Testset-cell'><input className='Testset-btn' type='text' value = {this.state.rel_hint} onChange = {(e) => this.editSearchTerm("rel", e.target.value)} placeholder = 'Search for a relation'/></td>
              <td></td>
              <td className='Testset-cell'><input className='Testset-btn' type='text' value = {this.state.tail_hint} onChange = {(e) => this.editSearchTerm("tail", e.target.value)} placeholder = 'Search for an entity'/></td>
            </tr>
            <tr>
              <td>
                <Button className='Testset-btn' variant="primary" onClick={() => this.sort("head")}>
                  Head {this.getIcon("head")}
                </Button>
              </td>
              <td></td>
              <td>
                <Button className='Testset-btn' variant="primary" onClick={() => this.sort("rel")}>
                  Relation {this.getIcon("rel")}
                </Button>
              </td>
              <td></td>
              <td>
                <Button className='Testset-btn' variant="primary" onClick={() => this.sort("tail")}>
                  Tail {this.getIcon("tail")}
                </Button>
              </td>
            </tr>
          </thead>
        );
    }
  }