import React, {useEffect, useState} from 'react';
import {Tab, Container, Row, Col, Form, Button, InputGroup, FormControl, Modal, ListGroup, Table, ProgressBar, Spinner, Alert} from 'react-bootstrap'
import './App.css';
import PropTypes from "prop-types";
import { withRouter } from "react-router";
import { FaRegCopy } from 'react-icons/fa'
import bsCustomFileInput from 'bs-custom-file-input';
import {from_timestamp, from_method_short} from './util';
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
        console.log(res);
        this.setState({datasets: res});
        if(pk){
          this.setState({selected_dataset_id: res.find(x => x["ID"] === pk)["ID"]});
        } else {
          this.setState({selected_dataset_id: res[0]["ID"]});
        }
      });
    }

    query_explainations(datasetId, pk){
      if(datasetId === -1){

      } else if(datasetId === -2){

      } else {
        API.getAllExplainationsByDatasetID(datasetId, (res) => {
          this.setState({
            explainations: res,
          })
          if(res.length > 0){
            if(pk){
              this.setState({selected_explaination_id: res.find(x => x["ID"] === pk)["ID"]});
            } else {
              this.setState({selected_explaination_id: res[0]["ID"]});
            }
          } else {
            this.setState({selected_explaination_id: null});
          }
        });
      }
    }

    constructor(){
      super()

      this.state = {
        datasets: [],
        explainations: [],
        formPage: 0,
        selected_dataset_id: null,
        private_dataset: null,
        selected_explaination_id: null,
        private_explaination: null
      };
    }

// Page handling

    onFormPageNext(){
      this.setState({formPage: 1});
      this.query_explainations(this.state.selected_dataset_id);
    }

    onFormPagePrevious(){
      this.setState({formPage: 0});
    }

    onFormPageDone(){
      console.log(this.state.selected_dataset_id);
      console.log(this.state.private_dataset);
      // none
      if(this.state.selected_dataset_id === -1){
        this.props.cookies.remove("datasetID");
        this.props.cookies.remove("datasetLabel");
      // private
      } else if(this.state.selected_dataset_id === -2) {
        this.props.cookies.set("datasetID", this.state.private_dataset);
        this.props.cookies.set("datasetLabel", this.state.private_dataset);
      } else {
        const dataset = this.state.datasets.find(x => x["ID"] === this.state.selected_dataset_id);
        var datasetLabel = dataset ? dataset["Name"] : "";
        this.props.cookies.set("datasetID", this.state.selected_dataset_id);
        this.props.cookies.set("datasetLabel", datasetLabel);
      }

      // none
      if(this.state.selected_explaination_id === -1){
        this.props.cookies.remove("explainationID");
        this.props.cookies.remove("explainationLabel");
      // private
      } else if(this.state.selected_explaination_id === -2) {
        this.props.cookies.set("explainationID", this.state.private_explaination);
        this.props.cookies.set("explainationLabel", this.state.private_explaination);
      } else {
        const explaination = this.state.explainations.find(x => x["ID"] === this.state.selected_explaination_id);
        var explainationLabel = explaination ? explaination["Label"] !== "" ? explaination["Label"] : from_timestamp(explaination["Date"]) : "";
        this.props.cookies.set("explainationID", this.state.selected_explaination_id);
        this.props.cookies.set("explainationLabel", explainationLabel);
      }
      this.props.history.push("/entities");
    }

// Modals

    onDatasetSelection(dataset_id){
      console.log(dataset_id);
      this.setState({selected_dataset_id: dataset_id});
    }

    onExplainationSelection(explaination_id){
      this.setState({selected_explaination_id: explaination_id});
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

    onUploadLocalExplaination(pk, published){
      if(published){
        this.query_explainations(this.state.selected_dataset_id, pk);
        this.onExplainationSelection(pk);
      } else {
        this.setState({
          private_explaination: pk
        });
        this.onExplainationSelection(-2);
      }
      
    }
  
    render(){
// Dataset selection
      if(this.state.formPage === 0){
        return (
          <div className="App-content">
            <Modal.Dialog className="Dataset-modal">
              <Modal.Header>
                <Modal.Title>Select a dataset</Modal.Title>
                <LocalDatasetModal onUpload={(pk, published) => {this.onUploadLocalDataset(pk, published)}}/>
                
              </Modal.Header>

              <Modal.Body>
              <Tab.Container id="list-group-tabs-example" activeKey={this.state.selected_dataset_id}>
                <Row>
                  <Col sm={4}>
                    <ListGroup className="pr-1 text-left" style={{overflowY: "auto", height: "400px"}}>
                      <ListGroup.Item action eventKey={-1} onClick={() => this.onDatasetSelection(-1)}>
                          <Container>
                            <Row>
                              <Col>
                                No dataset
                              </Col>
                              <Col>
                              </Col>
                            </Row>
                          </Container>
                      </ListGroup.Item>
                      <ListGroup.Item action eventKey={-2} onClick={() => this.onDatasetSelection(-2)}>
                          <Container>
                            <Row>
                              <Col>
                                Private dataset
                              </Col>
                              <Col>
                              </Col>
                            </Row>
                          </Container>
                      </ListGroup.Item>
                      { this.state.datasets.map((row) =>
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
                      <Tab.Pane eventKey={-1}>
                        The explorer can be used without a specified dataset, however nodes of the explaination file will appear as they appear in the dataset (without a label). Furthermore the visualization of the graph is not available.
                      </Tab.Pane>
                      <Tab.Pane eventKey={-2}>
                        { this.state.private_dataset ? 
                          <>
                            <p>Your uploaded private dataset. Please copy and save your private key for later reuse.</p>
                            <InputGroup className="mb-0">
                              <FormControl
                                readOnly
                                value={this.state.private_dataset}
                              />
                              <InputGroup.Append>
                                <Button variant="outline-secondary" className="d-flex" onClick={() => {navigator.clipboard.writeText(this.state.private_dataset)}}>
                                  <FaRegCopy className="m-auto"/>
                                </Button>
                              </InputGroup.Append>
                            </InputGroup>
                          </>
                          :
                          <>
                            <p>Here you can import your private key</p>
                            <Form onSubmit={(e)=> {e.preventDefault();console.log(e);this.setState({private_dataset: e.currentTarget.elements.private.value});}}>
                              <InputGroup className="mb-0">
                                <FormControl
                                  name="private"
                                />
                                <InputGroup.Append>
                                  <Button type="submit" variant="outline-secondary" className="d-flex">
                                    Load
                                  </Button>
                                </InputGroup.Append>
                              </InputGroup>
                            </Form>
                          </>
                        }
                      </Tab.Pane>
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
                <LocalExplainationModal datasetid={this.state.selected_dataset_id} onUpload={(pk, published) => {this.onUploadLocalExplaination(pk, published)}}/>
              </Modal.Header>
              <Modal.Body>
                <Tab.Container id="list-group-tabs-example" activeKey={this.state.selected_explaination_id}>
                  <Row>
                    <Col sm={4}>
                      <ListGroup className="pr-1 text-left" style={{overflowY: "auto", height: "400px"}}>
                        <ListGroup.Item action eventKey={-2} onClick={() => this.onExplainationSelection(-2)}>
                            <Container className="content-justify-left">
                              <Row>
                                <Col className="w-50">
                                  Private explaination
                                </Col>
                                <Col className="w-50">
                                </Col>
                              </Row>
                            </Container>
                        </ListGroup.Item>
                        { this.state.explainations.map((row) =>
                          <ListGroup.Item action eventKey={row["ID"]} onClick={() => this.onExplainationSelection(row["ID"])}>
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
                        <Tab.Pane eventKey={-2}>
                          { this.state.private_explaination ? 
                            <>
                              <p>Your uploaded private explaination. Please copy and save your private key for later reuse.</p>
                              <InputGroup className="mb-0">
                                <FormControl
                                  readOnly
                                  value={this.state.private_explaination}
                                />
                                <InputGroup.Append>
                                  <Button variant="outline-secondary" className="d-flex" onClick={() => {navigator.clipboard.writeText(this.state.private_explaination)}}>
                                    <FaRegCopy className="m-auto"/>
                                  </Button>
                                </InputGroup.Append>
                              </InputGroup>
                            </>
                            :
                            <>
                              <p>Here you can import your private key</p>
                              <Form onSubmit={(e)=> {e.preventDefault();console.log(e);this.setState({private_explaination: e.currentTarget.elements.private.value});}}>
                                <InputGroup className="mb-0">
                                  <FormControl
                                    name="private"
                                  />
                                  <InputGroup.Append>
                                    <Button type="submit" variant="outline-secondary" className="d-flex">
                                      Load
                                    </Button>
                                  </InputGroup.Append>
                                </InputGroup>
                              </Form>
                            </>
                          }
                        </Tab.Pane>
                        { this.state.explainations.map((row) =>
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
                <FormControl type="text" placeholder="Search" className=" mr-sm-2" />
              </Modal.Footer>
            </Modal.Dialog>

            
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
    const [publish, setPublish] = useState(true);
    const [published, setPublished] = useState(false);
    const [status, setStatus] = useState(null);
    const [now, setNow] = useState(0);
    const [pk, setPk] = useState("");

    function onSubmitLocalDataset(e){
      e.preventDefault();
      console.log("AHOI");
      API.callDatasetOperation(e.target, ["label_graph"], (status, progress, pk, published) => {
          console.log(status + " " + progress);
          if(status === "done"){
            //this.closeLocalDatasetModal(true);
            setStatus('done');
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
              setNow(0);
            }
            
          }
      });
    }

    useEffect(() => {   
      bsCustomFileInput.init(); 
    });

    function onClose(){
      setPublish(true);
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
          Load local dataset
        </Button>
        <Modal show={show} onHide={onClose}>
        <Modal.Header closeButton>
          <Modal.Title>Load local dataset</Modal.Title>
        </Modal.Header>
        <Modal.Body>
        <Form onSubmit={(e) => {onSubmitLocalDataset(e)}}>
          <FormControl name="method" value="create" className="d-none"/>
          <Form.Group>
            <Form.Label>Dataset</Form.Label>
            <Form.File 
              className="mb-2"
              name="training_set"
              label="Training set"
              custom
              />
            <Form.File 
              className="mb-2"
              name="test_set"
              label="Testing set (optional)"
              custom
              />
            <Form.File
              name="val_set"
              label="Validation set (optional)"
              custom
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>Label graph</Form.Label>
              <InputGroup className="mb-2">
                <Form.File
                  name="label_graph"
                  label="Label graph"
                  custom
                  />
                
                <InputGroup.Append>
                  <select className="form-control ml-2" name="rdftype">
                    <option value="text/turtle;charset=utf-8" selected>Turtle</option>
                    <option value="text/n3;charset=utf-8">N3</option>
                    <option value="text/plain">N-Triples</option>
                    <option value="application/rdf+xml">RDF/XML</option>
                    <option value="application/rdf+xml">OWL</option>
                    <option value="application/n-quads">N-Quads</option>
                    <option value="application/trig">TriG</option>
                    <option value="application/ld+json">JSON-LD</option>
                  </select>
                </InputGroup.Append>
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
                    <option value="on" selected>Public</option>
                    <option value="off" >Private</option>
                  </select>
              </InputGroup>
            </Form.Group>
            {publish ?
              <>
                <Form.Group controlId="dbName">
                  <Form.Label>Dataset name</Form.Label>
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
                    Upload completed!<br/>You can now select your dataset from the list.
                  </Alert>
                : ""
              }
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

  function LocalExplainationModal(props) {

    const [show, setShow] = useState(false);
    const [publish, setPublish] = useState(true);
    const [published, setPublished] = useState(false);
    const [status, setStatus] = useState(null);
    const [now, setNow] = useState(0);
    const [pk, setPk] = useState("");

    function onSubmitLocalExplaination(e){
      e.preventDefault();
      API.callExplainationOperation(e.target, ["explainationfile"], (status, progress, pk, published) => {
          console.log(status + " " + progress);
          if(status === "done"){
            setStatus('done');
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

    useEffect(() => {   
      bsCustomFileInput.init(); 
    });

    function onClose(){
      setPublish(true);
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
          Load local explaination
        </Button>
        <Modal show={show} onHide={onClose}>
        <Modal.Header closeButton>
          <Modal.Title>Load local explaination</Modal.Title>
        </Modal.Header>
        <Modal.Body>
        <Form onSubmit={(e) => {onSubmitLocalExplaination(e)}}>
          <FormControl name="method" value="create" className="d-none"/>
          <FormControl name="datasetid" value={props.datasetid} className="d-none"/>
          <Form.Group>
            <Form.Label>Explaination</Form.Label>
            <Form.File 
              name="explainationfile"
              label="Explaination file"
              custom
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>Scope</Form.Label>
              <InputGroup className="mb-3">
                <select className="form-control" name="publish" onChange={(e) => setPublish(e.target.value === "on")}>
                    <option value="on" selected>Public</option>
                    <option value="off" >Private</option>
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
                    Upload completed!<br/>You can now select your explaination from the list.
                  </Alert>
                : ""
              }
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
                  {publish? "Upload and publish explaination" : "Upload explaination"}
                </Button>
              : status === "done" ?
                <Button variant="primary" className="mt-3" onClick={(e) => onContinue(e)}>
                  {"Continue"}
                </Button>
              :
                <Button type="submit" variant="primary" className="mt-3" >
                  {publish? "Upload and publish explaination" : "Upload explaination"}
                </Button>
              }
            </Form.Group>
          </Form>

        </Modal.Body>
      </Modal>
    </>);
  }

  function LocalExplainationModalOl(props) {

    const [show, setShow] = useState(false);
    const [publish, setPublish] = useState(false);
    const [published, setPublished] = useState(false);
    const [status, setStatus] = useState(null);
    const [now, setNow] = useState(0);
    const [pk, setPk] = useState("");

    function onClose(){
      setPublish(false);
      setStatus(null);
      setNow(0);
      setPk("");
      setShow(false);
    }

    useEffect(() => {    
      bsCustomFileInput.init();
    });

    function onSubmitLocalExplaination(e){
      e.preventDefault();
      API.callExplainationOperation(e.target, ["explainationfile"], (status, progress, pk, published) => {
          if(status === "done"){
            setStatus('done');
            setPk(pk);
            setNow(0);
            setPublish(published);
          } else if(status === "zip") {
            setStatus('zip');
            setNow(0);;
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

    return(
      <>
        <Button variant="primary" onClick={() => setShow(true)}>
          Load local file
        </Button>
        <Modal show={show} onHide={onClose}>
          <Modal.Header closeButton>
            <Modal.Title>Load local explaination file</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <InputGroup className="mb-3">
              <Form.File 
                label="Select a file"
                custom
                />
              <InputGroup.Text>Publish?</InputGroup.Text>
              <InputGroup.Append>
              <InputGroup.Checkbox checked={publish} onChange={(e) => setPublish(e.target.checked)}/>
              </InputGroup.Append>
            </InputGroup>
            {publish ?
              <Form onSubmit={(e) => {onSubmitLocalExplaination(e)}}>
                <Form.Group>
                  <Form.Label>Label</Form.Label>
                  <Form.Control 
                    name="dbName"
                    placeholder="Label"/>
                </Form.Group>
                <Form.Group>
                  <Form.Label>Iterations</Form.Label>
                  <Form.Control 
                    placeholder="Iterations"
                  />
                </Form.Group>
                <Form.Group>
                  <Form.Label>Comment</Form.Label>
                  <Form.Control 
                    name="comment"
                    as="textarea" 
                    rows={3}/>
                </Form.Group>
              </Form>
              :""
            }

          </Modal.Body>
          <Modal.Footer>
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
                  <p>Upload completed, please copy your private key</p>
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
                  Upload completed!<br/>You can now select your dataset from the list.
                </Alert>
              : ""
            }
            <Button variant="secondary" onClick={onClose}>
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
                  {publish? "Upload and publish file" : "Upload file"}
                </Button>
              : status === "done" ?
                <Button variant="primary" className="mt-3" onClick={onClose}>
                  {"Continue"}
                </Button>
              :
                <Button type="submit" variant="primary" className="mt-3" >
                  {publish? "Upload and publish file" : "Upload file"}
                </Button>
              }
          </Modal.Footer>
        </Modal>
      </>
    );
  }