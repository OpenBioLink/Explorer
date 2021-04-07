import React from 'react';
import {Tab, Container, Row, Col, Form, Button, InputGroup, FormControl, Modal, ListGroup, Accordion, Card} from 'react-bootstrap'
import './App.css';
import PropTypes from "prop-types";
import { withRouter } from "react-router";
import bsCustomFileInput from 'bs-custom-file-input';
import Cookies from 'universal-cookie';
const util = require('./Util');
const API = require('./API');
    
const cookies = new Cookies();

export class Loader_ extends React.Component{

    static propTypes = {
      match: PropTypes.object.isRequired,
      location: PropTypes.object.isRequired,
      history: PropTypes.object.isRequired
    };

    componentDidMount(){
      API.getAllDatasets((res) => {
        this.setState({datasets: res});
        this.setState({dataset_selected: res[0]});
      });
    }

    constructor(){
      super()
      this.state = {
        datasets: [],
        explainations: [],
        formPage: 0,
        showLocalDatasetModal: false,
        showLocalDBModal: false,

        dataset_selected: null,
        explaination_selected: null,

        dataset_publish_local: false,
        dataset_name_local : null,
        dataset_version_local: null,
        dataset_description_local: null,
        dataset_train_local: null,
        dataset_test_local: null,
        dataset_valid_local: null,
        graph_file_local: null,
        graph_ns_local: null,

        db_file: null,
        db_remote: null,
        db_loaded: false,
        db_publish: false,
        db_name: "",
        db_version: "",
        db_description: ""
      };
    }
  
    changeLocalDb(event){
      this.setState({db_file: event.target.files[0]});
      //util.initDB(f, ()=>this.dbLoaded());
    }

    changeRemoteDb(event){
      this.setState({db_remote: event.target.files[0]});
      //util.initDB(f, ()=>this.dbLoaded());
    }

    dbLoaded(){
        this.setState({db_loaded: true})
    }

    changeGraph(event){
        var f = event.target.files[0];
        util.initGraph(f, ()=>this.graphLoaded());
    }

    graphLoaded(){
        console.log("LOADED");
    }

// Publish flags

    onChangePublishDataset(e){
      this.setState({dataset_publish: e.target.checked});
    }

    onChangePublishDb(e){
      this.setState({db_publish: e.target.checked});
    }

// Dataset metadata

    onDatasetSelection(dataset){
      console.log(dataset);
      this.setState({dataset_selected: dataset});
    }

// Exp file metadata

    onDBSelection(explaination){
      this.setState({explaination_selected: explaination});
    }

    onChangeNameDb(e){
      this.setState({db_name: e.target.value});
    }

    onChangeVersionDb(e){
      this.setState({db_version: e.target.value});
    }

    onChangeDescriptionDb(e){
      this.setState({db_description: e.target.value});
    }

// Page handling

    onFormPageNext(){
      this.setState({formPage: 1});
      API.getAllExplainationsByDatasetID(this.state.dataset_selected["ID"], (res) => {console.log(res);this.setState({explainations: res})})
    }

    onFormPagePrevious(){
      this.setState({formPage: 0});
    }

    onFormPageDone(){
      cookies.set("datasetID", this.state.dataset_selected["ID"]);
      cookies.set("explainationID", this.state.explaination_selected["ID"]);

      this.props.history.push("/entities");
    }

// Modals

    showLocalDatasetModal(){
      this.setState({showLocalDatasetModal: true});
    }

    closeLocalDatasetModal(){
      this.setState({showLocalDatasetModal: false});
    }

    showLocalDBModal(){
      this.setState({showLocalDBModal: true});
    }

    closeLocalDBModal(){
      this.setState({showLocalDBModal: false});
    }
  
    explain(){
      if(window.DB != null){
        this.props.history.push("/entities");
      } else {
        alert("DB is null");
      }
    }
  
    render(){
      bsCustomFileInput.init();
// Dataset selection
      if(this.state.formPage === 0){
        return (
          <div className="App-content">
            <Modal.Dialog scrollable={true} className="Dataset-modal">
              <Modal.Header>
                <Modal.Title>Select a dataset</Modal.Title>
                <Button variant="primary" onClick={() => this.showLocalDatasetModal()}>
                  Load local dataset
                </Button>
              </Modal.Header>

              <Modal.Body>
              <Tab.Container id="list-group-tabs-example" defaultActiveKey="1">
                <Row>
                  <Col sm={4}>
                    <ListGroup>
                      { this.state.datasets.map((row) =>
                        <ListGroup.Item action eventKey={row["ID"]} onClick={() => this.onDatasetSelection(row)}>
                          <Container>
                            <Row>
                              <Col>
                                {row["Name"]}
                              </Col>
                              <Col>
                                {row["Version"]}
                              </Col>
                            </Row>
                          </Container>
                      </ListGroup.Item>

                      )}
                    </ListGroup>
                  </Col>
                  <Col sm={8}>
                    <Tab.Content>
                      { this.state.datasets.map((row) =>
                      <Tab.Pane eventKey={row["ID"]}>
                        {row["Description"]}
                      </Tab.Pane>
                      )}
                    </Tab.Content>
                  </Col>
                </Row>
              </Tab.Container>
              </Modal.Body>
              <Modal.Footer>
                <FormControl type="text" placeholder="Search" className=" mr-sm-2" />
              </Modal.Footer>
            </Modal.Dialog>

            <Modal show={this.state.showLocalDatasetModal} onHide={() => this.closeLocalDatasetModal()}>
              <Modal.Header closeButton>
                <Modal.Title>Load local dataset</Modal.Title>
              </Modal.Header>
              <Modal.Body>
              <Form>
                <Form.Group controlId="datasetSelection">
                  <Form.Label>Dataset</Form.Label>
                  <Form.File 
                    onChange={(e) => this.changeLocalDb(e)}
                    label="Training set"
                    custom
                    />
                  <Form.File 
                    onChange={(e) => this.changeLocalDb(e)}
                    label="Testing set (optional)"
                    custom
                    />
                  <Form.File
                    onChange={(e) => this.changeLocalDb(e)}
                    label="Validation set (optional)"
                    custom
                    />
                  </Form.Group>
                  <Form.Group>
                    <Form.Label>Label graph</Form.Label>
                    <Form.File 
                      onChange={(e) => this.changeLocalDb(e)}
                      label="Label graph"
                      custom
                      />
                      <InputGroup className="mb-3">
                        <InputGroup.Prepend>
                          <InputGroup.Text>Node Namespace</InputGroup.Text>
                        </InputGroup.Prepend>
                        <FormControl
                          placeholder="http://example.org/"
                        />
                    </InputGroup>
                  </Form.Group>
                  <Form.Group>
                    <InputGroup className="mb-3">
                      <InputGroup.Text>Publish?</InputGroup.Text>
                      <InputGroup.Append>
                      <InputGroup.Checkbox onChange={(e) => this.onChangePublishDataset(e)}/>
                      </InputGroup.Append>
                    </InputGroup>
                  </Form.Group>
                </Form>
                
                {this.state.dataset_publish ?
                  <Form>
                    <Form.Group controlId="dbName">
                      <Form.Label>Dataset name</Form.Label>
                      <Form.Control placeholder="Dataset name" value={this.state.dataset_name} onChange={(e) => this.onChangeNameDb(e)}/>
                    </Form.Group>
                    <Form.Group controlId="dbVersion">
                      <Form.Label>Version</Form.Label>
                      <Form.Control placeholder="Version" value={this.state.dataset_version} onChange={(e) => this.onChangeVersionDb(e)}/>
                    </Form.Group>
                    <Form.Group controlId="dbDescription">
                      <Form.Label>Description</Form.Label>
                      <Form.Control as="textarea" rows={3} value={this.state.dataset_description} onChange={(e) => this.onChangeDescriptionDb(e)}/>
                    </Form.Group>
                  </Form>
                  :""
                }

              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onClick={() => this.closeLocalDatasetModal()}>
                  Close
                </Button>
                <Button variant="primary" onClick={() => this.closeLocalDatasetModal()}>
                  {this.state.dataset_publish? "Publish and load dataset" : "Load dataset"}
                </Button>
              </Modal.Footer>
            </Modal>

            <Button variant="primary" onClick={() => this.onFormPageNext()}>
              Next
            </Button>
          </div>
        );
      } 
// Exp file selection
      else if(this.state.formPage === 1){
        return (
          <div className="App-content">
            <Modal.Dialog scrollable={true} className="Dataset-modal">
              <Modal.Header>
                <Modal.Title>Select an explaination file</Modal.Title>
                <Button variant="primary" onClick={() => this.showLocalDBModal()}>
                  Load local file
                </Button>
              </Modal.Header>
              <Modal.Body>
              <ListGroup>
              { this.state.explainations.map((row) =>
                <ListGroup.Item action eventKey={row["ID"]} onClick={() => this.onDBSelection(row)}>
                  <Container>
                    <Row>
                      <Col>
                        {row["Date"]}
                      </Col>
                      <Col>
                        {row["Method"]}
                      </Col>
                      <Col>
                        {row["Strategy"]}
                      </Col>
                      <Col>
                        {row["Iterations"]}
                      </Col>
                      <Col>
                        {row["Resolution"]}
                      </Col>
                      <Col>
                        {row["Seed"]}
                      </Col>
                    </Row>
                  </Container>
                </ListGroup.Item>
              )}
            </ListGroup>
                
              </Modal.Body>
              <Modal.Footer>
                <FormControl type="text" placeholder="Search" className=" mr-sm-2" />
              </Modal.Footer>
            </Modal.Dialog>

            <Modal show={this.state.showLocalDBModal} onHide={() => this.closeLocalDBModal()}>
              <Modal.Header closeButton>
                <Modal.Title>Load local explaination file</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <InputGroup className="mb-3">
                  <Form.File 
                    onChange={(e) => this.changeLocalDb(e)}
                    label="Select a file"
                    custom
                    />
                  <InputGroup.Text>Publish?</InputGroup.Text>
                  <InputGroup.Append>
                  <InputGroup.Checkbox onChange={(e) => this.onChangePublishDb(e)}/>
                  </InputGroup.Append>
                </InputGroup>
                {this.state.db_publish ?
                  <Form>
                    <Form.Group controlId="dbName">
                      <Form.Label>Label</Form.Label>
                      <Form.Control placeholder="Label" value={this.state.db_name} onChange={(e) => this.onChangeNameDb(e)}/>
                    </Form.Group>
                    <Form.Group controlId="dbVersion">
                      <Form.Label>Iterations</Form.Label>
                      <Form.Control placeholder="Iterations" value={this.state.db_version} onChange={(e) => this.onChangeVersionDb(e)}/>
                    </Form.Group>
                    <Form.Group controlId="dbDescription">
                      <Form.Label>Comment</Form.Label>
                      <Form.Control as="textarea" rows={3} value={this.state.db_description} onChange={(e) => this.onChangeDescriptionDb(e)}/>
                    </Form.Group>
                  </Form>
                  :""
                }

              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onClick={() => this.closeLocalDBModal()}>
                  Close
                </Button>
                <Button variant="primary" onClick={() => this.closeLocalDBModal()}>
                  {this.state.db_publish? "Publish and load file" : "Load file"}
                </Button>
              </Modal.Footer>
            </Modal>

            <Button variant="primary" onClick={() => this.onFormPagePrevious()}>
              Previous
            </Button>
            <Button variant="primary" onClick={() => this.onFormPageDone()}>
              Load
            </Button>
          </div>
        );
      } 
    }
  }

  export const Loader = withRouter(Loader_);