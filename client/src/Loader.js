import React, {useEffect, useState} from 'react';
import {Tab, Container, Row, Col, Form, Button, InputGroup, FormControl, Modal, ListGroup, Table, ProgressBar, Spinner, Alert} from 'react-bootstrap'
import './App.css';
import PropTypes from "prop-types";
import { withRouter } from "react-router";
import { FaRegCopy } from 'react-icons/fa'
import bsCustomFileInput from 'bs-custom-file-input';
import {from_timestamp, from_method_short, sortAsc} from './util';
const API = require('./API');

export class Loader_ extends React.Component{

    static propTypes = {
      match: PropTypes.object.isRequired,
      location: PropTypes.object.isRequired,
      history: PropTypes.object.isRequired
    };

    componentDidMount(){
      this.query_datasets();
    }

    query_datasets(pk) {
      API.getAllDatasets((res) => {
        this.setState({datasets: res});
        if(pk){
          this.setState({selected_dataset_id: res.find(x => x["ID"] === pk)["ID"]});
        } else {
          this.setState({selected_dataset_id: res.length > 0 ? res[0]["ID"] : null});
        }
      });
    }

    query_explanations(datasetId, pk){
      if(datasetId === -1){

      } else if(datasetId === -2){

      } else {
        API.getAllExplanationsByDatasetID(datasetId, (res) => {
          this.setState({
            explanations: res,
          })
          if(res.length > 0){
            if(pk){
              this.setState({selected_explanation_id: res.find(x => x["ID"] === pk)["ID"]});
            } else {
              this.setState({selected_explanation_id:  res.length > 0 ? res[0]["ID"] : null});
            }
          } else {
            this.setState({selected_explanation_id: null});
          }
        });
      }
    }

    constructor(){
      super()

      this.state = {
        datasets: [],
        explanations: [],
        formPage: 0,
        selected_dataset_id: null,
        selected_explanation_id: null,

        searchTerm: "",

        show_alert: false,
        alert_message: "",

        show_done_spinner: false
      };
    }

// Page handling

    onFormPageNext(){
      if((this.state.selected_dataset_id == null || this.state.selected_dataset_id === "")) {
        this.setState({
          show_alert: true,
          alert_message: "Please select a dataset"
        });
      } else {
        this.setState({
          formPage: 1,
          searchTerm: "",
        });
        this.query_explanations(this.state.selected_dataset_id);
      }
    }

    onFormPagePrevious(){
      this.setState({
        formPage: 0,
        searchTerm: ""
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

        // removes session storage (entities, asc, active page...)
        window.sessionStorage.clear();

        API.getAllTestEntities(this.state.selected_dataset_id, this.state.selected_explanation_id, (entities) => {
          window.sessionStorage.setItem(this.state.selected_dataset_id+'_entities', JSON.stringify(sortAsc(entities["entities"])));
          window.sessionStorage.setItem(this.state.selected_dataset_id+'_types', JSON.stringify(entities["types"]));
          this.setState({show_done_spinner: false});
          this.props.history.push(`/entities/${this.state.selected_dataset_id}/${this.state.selected_explanation_id}`);
        });
      }
    }

// Modals

    onDatasetSelection(dataset_id){
      this.setState({selected_dataset_id: dataset_id});
    }

    onExplanationSelection(explanation_id){
      this.setState({selected_explanation_id: explanation_id});
    }

    onUploadLocalDataset(pk, published){
      if(published){
        this.query_datasets(pk);
        this.onDatasetSelection(pk);
      } else {
        this.setState({
          private_dataset: pk
        });
        this.onDatasetSelection(-2);
      }
    }

    onUploadLocalExplanation(pk, published){
      if(published){
        this.query_explanations(this.state.selected_dataset_id, pk);
        this.onExplanationSelection(pk);
      } else {
        this.setState({
          private_explanation: pk
        });
        this.onExplanationSelection(-2);
      }
      
    }
  
    render(){
// Dataset selection
      if(this.state.formPage === 0){
        return (
          <div className="App-content">
            <Modal.Dialog className="mx-auto mw-100 w-75 mb-2">
              <Modal.Header>
                <Modal.Title>Select a dataset</Modal.Title>
                <LocalDatasetModal onUpload={(pk, published) => {this.onUploadLocalDataset(pk, published)}}/>
              </Modal.Header>

              <Modal.Body>
              <Tab.Container id="list-group-tabs-example" activeKey={this.state.selected_dataset_id}>
                <Row>
                  <Col sm={4}>
                    <ListGroup className="pr-1 text-left" style={{overflowY: "auto", height: "400px"}}>
                      { this.state.datasets.filter(x => (this.state.searchTerm === "" || x["Name"].toLowerCase().includes(this.state.searchTerm.toLowerCase()))).map((row) =>
                        <ListGroup.Item action eventKey={row["ID"]} onClick={() => this.onDatasetSelection(row["ID"])}>
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
                  <Col sm={8} className="my-auto">
                    <Tab.Content className="text-center">
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
              </Modal.Header>
              <Modal.Body>
                <Tab.Container id="list-group-tabs-example" activeKey={this.state.selected_explanation_id}>
                  <Row>
                    <Col sm={4}>
                      <ListGroup className="pr-1 text-left" style={{overflowY: "auto", height: "400px"}}>
                        { this.state.explanations.filter(x => (this.state.searchTerm === "" || x["Label"].toLowerCase().includes(this.state.searchTerm.toLowerCase()))).map((row) =>
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
                      </ListGroup>
                    </Col>
                    <Col sm={8} className="my-auto">
                      <Tab.Content >
                        { this.state.explanations.map((row) =>
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
    const [publish, setPublish] = useState(false);
    const [published, setPublished] = useState(false);
    const [status, setStatus] = useState(null);
    const [now, setNow] = useState(0);
    const [pk, setPk] = useState("");

    const [disable, setDisable] = useState(false);
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState("");

    function onSubmitLocalDataset(e){
      e.preventDefault();
      
      if(e.target.elements.label_graph.files.length === 0){
        setAlertMessage("Please select a label graph file.")
        setShowAlert(true);
      } else if(e.target.elements.namespace.value == null || e.target.elements.namespace.value === "") {
        setAlertMessage("Please set the namespace used for the nodes in the knowledge graph.")
        setShowAlert(true);
      } else if(e.target.elements.publish.value === 'on' && e.target.elements.dbName.value === ""){
        setAlertMessage("Please enter a Name for the dataset.")
        setShowAlert(true);
      } else {
        setDisable(true);
        if(e.target.elements.publish.value === 'on'){
          const data = new FormData(e.target);
          const json = Object.fromEntries(data.entries());
          API.addNewDataset(json, (response) => {
            setStatus('done');
            setDisable(false);
            setPk(response[pk]);
            setNow(0);
            setPublished(response[published]);
          });
        }
      }
    }

    useEffect(() => {   
      bsCustomFileInput.init(); 
    });

    function onClose(){
      setPublish(false);
      setPublished(false);
      setStatus(null);
      setNow(0);
      setPk("");
      setShow(false);
    }

    function onContinue(e){
      e.preventDefault();
      props.onUpload(pk, published);
      onClose();
    }

    return(
      <>
        <Button variant="primary" onClick={() => setShow(true)}>
          Add dataset
        </Button>
        <Modal show={show} onHide={onClose} keyboard={!disable} backdrop={disable ? "static" : true}> 
        <Modal.Header closeButton style={disable ? {pointerEvents: "none"} : {}}>
          <Modal.Title>Add dataset</Modal.Title>
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
              <InputGroup className="mb-3">
                <InputGroup.Prepend>
                  <InputGroup.Text>Node Namespace</InputGroup.Text>
                </InputGroup.Prepend>
                <FormControl
                  name="namespace"
                  placeholder="http://example.org/"
                />
              </InputGroup>
            </Form.Group>
            <Form.Group>
              <Form.Label>Scope</Form.Label>
              <InputGroup className="mb-3">
                <select className="form-control" name="publish" onChange={(e) => setPublish(e.target.value === "on")}>
                    <option value="off" selected>Private</option>
                    <option value="on">Public</option>
                  </select>
              </InputGroup>
            </Form.Group>
            {publish ?
              <>
                <Form.Group controlId="dbName">
                  <Form.Label>Dataset name*</Form.Label>
                  <Form.Control 
                    name="dbName"
                    placeholder="Dataset name" />
                </Form.Group>
                <Form.Group controlId="dbVersion">
                  <Form.Label>Version</Form.Label>
                  <Form.Control
                    name="dbVersion"
                    placeholder="Version" />
                </Form.Group>
                <Form.Group controlId="dbDescription">
                  <Form.Label>Description</Form.Label>
                  <Form.Control 
                    name="dbDescription"
                    as="textarea" 
                    rows={3} />
                </Form.Group>
              </>
              :""
            }
            <Form.Group className="text-right border-top mb-0">
              {
                status === "upload" ?
                  <ProgressBar now={now} className="text-left mt-2" label={`uploading...`}/>
                : status === "server" ? 
                  <Alert variant="info" className="mt-2 mb-0">
                    The Server is processing your upload, this may take a while
                  </Alert>
                : status === "zip" ? 
                  <Alert variant="info" className="mt-2 mb-0">
                      Zipping file, this may take a while
                  </Alert>
                : status === "done" && !published ?
                  <Alert variant="success" className="text-center mt-2 mb-0">
                    <p>Upload completed! Please copy and save your private key for later reuse.</p>
                    <InputGroup className="mb-0">
                      <FormControl
                        readOnly
                        value={pk}
                      />
                      <InputGroup.Append>
                        <Button variant="outline-secondary" className="d-flex" onClick={() => {navigator.clipboard.writeText(pk)}}>
                          <FaRegCopy className="m-auto"/>
                        </Button>
                      </InputGroup.Append>
                    </InputGroup>
                  </Alert>
                : status === "done" && published ?
                  <Alert variant="success" className="text-center mt-2 mb-0">
                    Success!<br/>You can now select your dataset from the list.
                  </Alert>
                : ""
              }
              <Alert className="text-left mt-2 mb-0" variant="danger" show={showAlert} onClose={() => setShowAlert(false)} dismissible>
                {alertMessage}
              </Alert>
              <Button variant="secondary" className="mt-3 mr-2" onClick={onClose}>
                Close
              </Button>

              {status !== null && status !== "done"? 
                <Button variant="primary" className="mt-3" disabled>
                  <Spinner
                    className="mr-1"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                  />
                  {publish? "Upload and publish dataset" : "Upload dataset"}
                </Button>
              : status === "done" ?
                <Button variant="primary" className="mt-3" onClick={(e) => onContinue(e)}>
                  {"Continue"}
                </Button>
              :
                <Button type="submit" variant="primary" className="mt-3" >
                  {publish? "Upload and publish dataset" : "Upload dataset"}
                </Button>
              }
            </Form.Group>
          </Form>

        </Modal.Body>
      </Modal>
    </>);
  }

  function LocalExplanationModal(props) {

    const [show, setShow] = useState(false);
    const [publish, setPublish] = useState(false);
    const [published, setPublished] = useState(false);
    const [status, setStatus] = useState(null);
    const [now, setNow] = useState(0);
    const [pk, setPk] = useState("");

    const [disable, setDisable] = useState(false);
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState("");

    function onSubmitLocalExplanation(e){
      e.preventDefault();
      if(e.target.elements.explanationfile.files.length === 0){
        setAlertMessage("Please select an explanation file");
        setShowAlert(true);
      } else {
        setDisable(true);
        API.callExplanationOperation(e.target, ["explanationfile"], (status, progress, pk, published) => {
            console.log(status + " " + progress);
            if(status === "done"){
              setStatus('done');
              setDisable(false);
              setPk(pk);
              setNow(0);
              setPublished(published);
            } else if(status === "zip") {
              setStatus('zip');
              setNow(0);
            } else {
              if(progress < 100){
                setStatus('upload');
                setNow(progress);
              } else {
                setStatus('server');
                setNow(0);;
              }
              
            }
        });
      }
    }

    useEffect(() => {   
      bsCustomFileInput.init(); 
    });

    function onClose(){
      setPublish(false);
      setPublished(false);
      setStatus(null);
      setNow(0);
      setPk("");
      setShow(false);
    }

    function onContinue(e){
      e.preventDefault();
      props.onUpload(pk, published);
      onClose();
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
          <FormControl name="method" value="create" className="d-none"/>
          <FormControl name="datasetid" value={props.datasetid} className="d-none"/>
          <Form.Group>
            <Form.Label>Explanation*</Form.Label>
            <Form.File 
              name="explanationfile"
              label="Explanation file"
              accept=".db"
              custom
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>Scope</Form.Label>
              <InputGroup className="mb-3">
                <select className="form-control" name="publish" onChange={(e) => setPublish(e.target.value === "on")}>
                    <option value="off" selected>Private</option>
                    <option value="on">Public</option>
                  </select>
              </InputGroup>
            </Form.Group>
            {publish ?
              <>
                <Form.Group>
                  <Form.Label>Label</Form.Label>
                  <Form.Control 
                    name="label"
                    placeholder="Label" />
                </Form.Group>
                <Form.Group>
                  <Form.Label>Method</Form.Label>
                  <select className="form-control" name="aggmethod">
                    <option value="nrno" selected>Non redundant Noisy-Or</option>
                    <option value="no" >Noisy-Or</option>
                    <option value="max" >Maximum</option>
                  </select>
                </Form.Group>
                <Form.Group controlId="dbVersion">
                  <Form.Label>Config file used for learning rules</Form.Label>
                  <Form.File 
                    name="ruleconfig"
                    label="Config file"
                    custom
                    />
                </Form.Group>
                <Form.Group controlId="dbVersion">
                  <Form.Label>Config file used for clustering rules</Form.Label>
                  <Form.File 
                    name="clusteringconfig"
                    label="Config file"
                    custom
                    />
                  <Form.Text className="text-muted">
                    (Only required when using method "Non redundant Noisy-Or")
                  </Form.Text>
                </Form.Group>
                <Form.Group controlId="dbDescription">
                  <Form.Label>Comment</Form.Label>
                  <Form.Control 
                    name="comment"
                    as="textarea" 
                    rows={3} />
                </Form.Group>
              </>
              :""
            }
            <Form.Group className="text-right border-top mb-0">
              {
                status === "upload" ?
                  <ProgressBar now={now} className="text-left mt-2" label={`uploading...`}/>
                : status === "server" ? 
                  <Alert variant="info" className="mt-2 mb-0">
                    The Server is processing your upload, this may take a while
                  </Alert>
                : status === "zip" ? 
                  <Alert variant="info" className="mt-2 mb-0">
                      Zipping file, this may take a while
                  </Alert>
                : status === "done" && !published ?
                  <Alert variant="success" className="text-center mt-2 mb-0">
                    <p>Upload completed! Please copy and save your private key for later reuse.</p>
                    <InputGroup className="mb-0">
                      <FormControl
                        readOnly
                        value={pk}
                      />
                      <InputGroup.Append>
                        <Button variant="outline-secondary" className="d-flex" onClick={() => {navigator.clipboard.writeText(pk)}}>
                          <FaRegCopy className="m-auto"/>
                        </Button>
                      </InputGroup.Append>
                    </InputGroup>
                  </Alert>
                : status === "done" && published ?
                  <Alert variant="success" className="text-center mt-2 mb-0">
                    Upload completed!<br/>You can now select your explanation from the list.
                  </Alert>
                : ""
              }
              <Alert className="text-left mt-2 mb-0" variant="danger" show={showAlert} onClose={() => setShowAlert(false)} dismissible>
                {alertMessage}
              </Alert>
              <Button variant="secondary" className="mt-3 mr-2" onClick={onClose}>
                Close
              </Button>

              {status !== null && status !== "done"? 
                <Button variant="primary" className="mt-3" disabled>
                  <Spinner
                    className="mr-1"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                  />
                  {publish? "Upload and publish explanation" : "Upload explanation"}
                </Button>
              : status === "done" ?
                <Button variant="primary" className="mt-3" onClick={(e) => onContinue(e)}>
                  {"Continue"}
                </Button>
              :
                <Button type="submit" variant="primary" className="mt-3" >
                  {publish? "Upload and publish explanation" : "Upload explanation"}
                </Button>
              }
            </Form.Group>
          </Form>

        </Modal.Body>
      </Modal>
    </>);
  }