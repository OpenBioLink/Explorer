import React, {useEffect, useState} from 'react';
import {Tab, Container, Row, Col, Form, Button, InputGroup, FormControl, Modal, ListGroup, Table, ProgressBar, Spinner, Alert} from 'react-bootstrap'
import './App.css';
import PropTypes from "prop-types";
import { withRouter } from "react-router";
import bsCustomFileInput from 'bs-custom-file-input';
import {from_timestamp, from_method_short, sortAsc, datasetID2Endpoint} from './util';
import API from 'api';
import initSqlJs from "sql.js";
import {db, setDB, isDBCached} from "./IndexedDB/IndexedDB"

export class Loader_ extends React.Component{

    static propTypes = {
      match: PropTypes.object.isRequired,
      location: PropTypes.object.isRequired,
      history: PropTypes.object.isRequired
    };

    componentDidMount(){
      API.getIndex((res) => {
        this.setState({index: res});
        this.setState({selected_dataset_id: res["Dataset"].length > 0 ? res["Dataset"][0]["ID"] : null});
        this.setState({selected_explanation_id:  res["Dataset"][0]["Explanation"].length > 0 ? res["Dataset"][0]["Explanation"][0]["ID"] : null});
      });
    }

    constructor(){
      super()

      this.state = {
        index: {
          "Dataset": [],
        },
        formPage: 0,
        selected_dataset_id: null,
        selected_explanation_id: null,

        searchTerm: "",

        show_alert: false,
        alert_message: "",

        show_done_spinner: false,
        show_loading_spinner: false
      };
    }

// Page handling

    onFormPageNext(){
      if((this.state.selected_dataset_id == null || this.state.selected_dataset_id === "")) {
        this.setState({
          show_alert: true,
          alert_message: "Please select a dataset",
        });
      } else {
        let default_explanation_id = this.state.index["Dataset"].find(x => (x["ID"] == this.state.selected_dataset_id))["Explanation"]
        default_explanation_id = default_explanation_id.length > 0 ? default_explanation_id[0]["ID"]: null
        this.setState({
          formPage: 1,
          searchTerm: "",
          selected_explanation_id: default_explanation_id
        });
      }
    }

    onFormPagePrevious(){
      this.setState({
        formPage: 0,
        searchTerm: "",
        selected_explanation_id: null,
      });
    }

    onFormPageDone(){
      if((this.state.selected_explanation_id == null || this.state.selected_explanation_id === "")) {
        this.setState({
          show_alert: true,
          alert_message: "Please select a explanation"
        });
      } else {
        this.setState({show_done_spinner: true});

        isDBCached(this.state.selected_dataset_id, this.state.selected_explanation_id).then((itIs) => {
          if(!itIs || this.state.selected_explanation_id == "local"){
            console.log(this.state.selected_dataset_id + "_" + this.state.selected_explanation_id + " not cached loading")
            API.getAllTestEntities(this.state.selected_dataset_id, this.state.selected_explanation_id, (entities) => {
              setDB(entities["entities"], entities["types"], this.state.selected_dataset_id, this.state.selected_explanation_id).then(() => {
                this.setState({show_done_spinner: false});
                this.props.history.push(`/${this.state.selected_dataset_id}/${this.state.selected_explanation_id}/entities`);
              })
            });
          } else {
            this.setState({show_done_spinner: false});
            this.props.history.push(`/${this.state.selected_dataset_id}/${this.state.selected_explanation_id}/entities`);
            console.log(this.state.selected_dataset_id + "_" + this.state.selected_explanation_id + " cached")
          }
        });
         
      }
    }

    // Modals
    onDatasetSelection(dataset_id){
      this.setState({selected_dataset_id: dataset_id});
    }

    async onExplanationSelection(explanation_id){
      this.setState({selected_explanation_id: explanation_id});
    }
  
    render(){
// Dataset selection
      if(this.state.formPage === 0){
        return (
          <div className="App-content">
            <Modal.Dialog className="mx-auto mw-100 w-75 mb-2">
              <Modal.Header>
                <Modal.Title>Select a dataset</Modal.Title>
                <LocalDatasetModal onUpload={(endpoint) => {this.onDatasetSelection(endpoint);}}/>
              </Modal.Header>

              <Modal.Body>
              <Tab.Container id="list-group-tabs-example" activeKey={this.state.selected_dataset_id?.startsWith("local-") ? "local" : this.state.selected_dataset_id}>
                <Row>
                  <Col sm={4}>
                    <ListGroup className="pr-1 text-left" style={{overflowY: "auto", height: "400px"}}>
                      { this.state.index ? this.state.index["Dataset"].filter(x => (this.state.searchTerm === "" || x["Name"].toLowerCase().includes(this.state.searchTerm.toLowerCase()))).map((row) =>
                        <ListGroup.Item action eventKey={row["ID"]} onClick={() => this.onDatasetSelection(row["ID"])}>
                          <Container>
                            <Row>
                              <Col className="w-50">
                                {row["Name"]}
                              </Col>
                              <Col className="w-50">
                                {row["Version"]}
                              </Col>
                            </Row>
                          </Container>
                      </ListGroup.Item>

                      ) : ""}
                      { this.state.selected_dataset_id?.startsWith("local-") ?
                        <ListGroup.Item action eventKey="local">
                          <Container>
                            <Row>
                              <Col className="w-50">
                                Custom
                              </Col>
                              <Col className="w-50">
                              </Col>
                            </Row>
                          </Container>
                        </ListGroup.Item> : ""
                      }
                    </ListGroup>
                  </Col>
                  <Col sm={8} className="my-auto">
                    <Tab.Content className="text-center">
                      { this.state.index["Dataset"].map((row) =>
                      <Tab.Pane eventKey={row["ID"]}>
                        {row["Description"]}
                      </Tab.Pane>
                      )}
                      <Tab.Pane eventKey="local">
                        Custom dataset, SPARQL endpoint:<br/>{this.state.selected_dataset_id?.replace("local-", "")}
                      </Tab.Pane>
                    </Tab.Content>
                  </Col>
                </Row>
              </Tab.Container>
              </Modal.Body>
              <Modal.Footer>
                <FormControl type="text" placeholder="Search" value={this.state.searchTerm} onChange={(e) => this.setState({searchTerm: e.target.value})} className=" mr-sm-2" />
              </Modal.Footer>
            </Modal.Dialog>
            <Alert className="mx-auto mw-100 w-75 mb-2" variant="danger" show={this.state.show_alert} onClose={() => this.setState({show_alert: false})} dismissible>
              {this.state.alert_message}
            </Alert>
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
            <Modal.Dialog scrollable={true} className="mx-auto mw-100 w-75 mb-2">
              <Modal.Header>
                <Modal.Title>Select an explanation file</Modal.Title>
                <LocalExplanationModal onUpload={(localfile) => {this.onExplanationSelection(localfile)}}/>
              </Modal.Header>
              <Modal.Body>
                <Tab.Container id="list-group-tabs-example" activeKey={this.state.selected_explanation_id}>
                  <Row>
                    <Col sm={4}>
                      <ListGroup className="pr-1 text-left" style={{overflowY: "auto", height: "400px"}}>
                        { this.state.index["Dataset"].find((x) => x["ID"] == this.state.selected_dataset_id)["Explanation"]
                          .filter(x => (this.state.searchTerm === "" || x["Label"].toLowerCase().includes(this.state.searchTerm.toLowerCase())))
                          .map((row) =>
                          <ListGroup.Item action eventKey={row["ID"]} onClick={() => this.onExplanationSelection(row["ID"])}>
                            <Container>
                              <Row>
                                <Col className="w-50">
                                  {row["Label"] !== "" ? row["Label"] : from_timestamp(row["Date"])}
                                </Col>
                                <Col className="w-50">
                                  {from_method_short(row["Method"])}
                                </Col>
                              </Row>
                            </Container>
                        </ListGroup.Item>
                        )}
                        { this.state.selected_explanation_id?.startsWith("local") ?
                          <ListGroup.Item action eventKey="local">
                            <Container>
                              <Row>
                                <Col className="w-50">
                                  Local explanation file
                                </Col>
                                <Col className="w-50">
                                </Col>
                              </Row>
                            </Container>
                        </ListGroup.Item> : ""
                        }
                      </ListGroup>
                    </Col>
                    <Col sm={8} className="my-auto">
                      <Tab.Content >
                        { this.state.index["Dataset"].find((x) => x["ID"] == this.state.selected_dataset_id)["Explanation"].map((row) =>
                          <Tab.Pane className="text-left" style={{overflowY: "auto", height: "400px"}} eventKey={row["ID"]}>
                            <table>
                              <tbody>
                                <tr>
                                  <td className="w-25 align-top">
                                    <b>Rule learning configuration</b>
                                  </td>
                                  <td className="w-75 align-top pr-3">
                                    <span style={{whiteSpace: "pre-wrap"}}>{row["RuleConfig"]}</span>
                                  </td>
                                </tr>
                                <tr className="border-top">
                                  <td  className="w-25 align-top py-3">
                                    <b>Clustering configuration</b>
                                  </td>
                                  <td className="w-75 align-top py-3 pr-3">
                                    <span style={{whiteSpace: "pre-wrap"}}>{row["ClusteringConfig"]}</span>
                                  </td>
                                </tr>
                                <tr className="border-top">
                                  <td  className="w-25 align-top py-3">
                                    <b>Comment</b>
                                  </td>
                                  <td className="w-75 align-top py-3 pr-3">
                                    <span style={{whiteSpace: "pre-wrap"}}>{row["Comment"]}</span>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </Tab.Pane>
                        )}
                         <Tab.Pane className="text-left" style={{overflowY: "auto", height: "400px"}} eventKey="local">
                           Local explanation file
                        </Tab.Pane>
                      </Tab.Content>
                    </Col>
                  </Row>
                </Tab.Container>
              </Modal.Body>
              <Modal.Footer>
                <FormControl type="text" placeholder="Search" value={this.state.searchTerm} onChange={(e) => this.setState({searchTerm: e.target.value})} className=" mr-sm-2" />
              </Modal.Footer>
            </Modal.Dialog>
            <Alert className="mx-auto mw-100 w-75 mb-2" variant="danger" show={this.state.show_alert} onClose={() => this.setState({show_alert: false})} dismissible>
              {this.state.alert_message}
            </Alert>
            
            <table className="w-100">
              <tbody>
                <tr>
                  <td className="w-50 text-right">
                    <Button variant="primary" className="mr-1" onClick={() => this.onFormPagePrevious()}>
                      Previous
                    </Button>
                  </td>
                  <td className="w-50 text-left">
                    <Button variant="primary" className="ml-1" onClick={() => this.onFormPageDone()}>
                      {this.state.show_done_spinner ? 
                        <Spinner
                          className="mr-1"
                          animation="border"
                          size="sm"
                          role="status"
                          aria-hidden="true"
                        />
                      : ""}
                      Done
                    </Button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        );
      } 
    }
  }

  export const Loader = withRouter(Loader_);

  function LocalDatasetModal(props) {

    const [show, setShow] = useState(false);
    const [disable, setDisable] = useState(false);
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState("");

    function onSubmitLocalDataset(e){
      e.preventDefault();
      
      if(e.target.elements.endpoint.value == null || e.target.elements.endpoint.value === ""){
        setAlertMessage("Please select a SPARQL endpoint.")
        setShowAlert(true);
      } else {
        onClose();
        props.onUpload("local-" + encodeURI(e.target.elements.endpoint.value));
      }
    }

    useEffect(() => {   
      bsCustomFileInput.init(); 
    });

    function onClose(){
      setShow(false);
    }

    return(
      <>
        <Button variant="primary" onClick={() => setShow(true)}>
          Load custom endpoint
        </Button>
        <Modal show={show} onHide={onClose} keyboard={!disable} backdrop={disable ? "static" : true}> 
        <Modal.Header closeButton style={disable ? {pointerEvents: "none"} : {}}>
          <Modal.Title>Load custom endpoint</Modal.Title>
        </Modal.Header>
        <Modal.Body style={disable ? {pointerEvents: "none"} : {}}>
        <Form onSubmit={(e) => {onSubmitLocalDataset(e)}}>
            <Form.Group>
              <Form.Label>SPARQL Endpoint</Form.Label>
              <InputGroup className="mb-2">
                <FormControl
                    name="endpoint"
                    placeholder="http://example.org/sparql"
                />
              </InputGroup>
            </Form.Group>
            <Form.Group className="text-right border-top mb-0">
              <Alert className="text-left mt-2 mb-0" variant="danger" show={showAlert} onClose={() => setShowAlert(false)} dismissible>
                {alertMessage}
              </Alert>
              <Button variant="secondary" className="mt-3 mr-2" onClick={onClose}>
                Close
              </Button>
              <Button type="submit" variant="primary" className="mt-3" >
                Load
              </Button>
            </Form.Group>
          </Form>

        </Modal.Body>
      </Modal>
    </>);
  }

  function LocalExplanationModal(props) {

    const [show, setShow] = useState(false);
    const [disable, setDisable] = useState(false);
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState("");
    const [showLoadingSpinner, setShowLoadingSpinner] = useState(false);

    async function onSubmitLocalExplanation(e){
      e.preventDefault();
      if(e.target.elements.explanationfile.files.length === 0){
        setAlertMessage("Please select an explanation file");
        setShowAlert(true);
      } else {
        setShowLoadingSpinner(true);
        const SQL = await initSqlJs({
          // Required to load the wasm binary asynchronously. Of course, you can host it wherever you want
          // You can omit locateFile completely when running in node
          locateFile: file => `https://sql.js.org/dist/${file}`
        });
        const r = new FileReader();
        r.onload = function() {
          const Uints = new Uint8Array(r.result);
          window.db = new SQL.Database(Uints);
          setShowLoadingSpinner(false);
          onClose();
          props.onUpload("local");
        }
        r.readAsArrayBuffer(e.target.elements.explanationfile.files[0]);

      }
    }

    useEffect(() => {   
      bsCustomFileInput.init(); 
    });

    function onClose(){
      setShow(false);
    }

    return(
      <>
        <Button variant="primary"  onClick={() => setShow(true)}>
          Load local explanation
        </Button>
        <Modal show={show} onHide={onClose} keyboard={!disable} backdrop={disable ? "static" : true}>
        <Modal.Header closeButton style={disable ? {pointerEvents: "none"} : {}}>
          <Modal.Title>Load local explanation</Modal.Title>
        </Modal.Header>
        <Modal.Body style={disable ? {pointerEvents: "none"} : {}}>
        <Form onSubmit={(e) => {onSubmitLocalExplanation(e)}}>
          <Form.Group>
            <Form.Label>Explanation</Form.Label>
            <Form.File 
              name="explanationfile"
              label="Explanation file"
              accept=".db"
              custom
              />
            </Form.Group>
            <Form.Group className="text-right border-top mb-0">
              <Alert className="text-left mt-2 mb-0" variant="danger" show={showAlert} onClose={() => setShowAlert(false)} dismissible>
                {alertMessage}
              </Alert>
              <Button variant="secondary" className="mt-3 mr-2" onClick={onClose}>
                Close
              </Button>
              <Button type="submit" variant="primary" className="mt-3" >
                {showLoadingSpinner ? 
                <Spinner
                  className="mr-1"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                />
              : ""}
                Load local explanation
              </Button>
            </Form.Group>
          </Form>

        </Modal.Body>
      </Modal>
    </>);
  }