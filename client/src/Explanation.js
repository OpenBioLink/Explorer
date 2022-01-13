import React, {useState, useContext, useEffect, useRef} from 'react';
import { useAccordionToggle } from "react-bootstrap/AccordionToggle";
import PropTypes from "prop-types";
import { withRouter } from "react-router";
import './App.css';
import {Container, Row, Col, ListGroup, Modal, Spinner, Table, Accordion, Card, Button, AccordionContext, OverlayTrigger, Tooltip} from 'react-bootstrap';
import { IconContext } from "react-icons";
import { RiArrowDropDownLine, RiArrowDropRightLine } from "react-icons/ri";
import { HiOutlineDocumentSearch, HiOutlineVariable } from "react-icons/hi"
import { FaArrowRight } from "react-icons/fa";
import { Network } from "vis-network";

import { ellipsis } from './util';

import API from 'api'

export class Explanation_ extends React.Component{

    static propTypes = {
        match: PropTypes.object.isRequired,
        location: PropTypes.object.isRequired,
        history: PropTypes.object.isRequired
      };

    constructor(){
        super();
        this.state = {
            datasetID: null,
            explanationID: null,

            info: null,
            explanation: null,

            showInstantiations: false,
            selectedRule: null,
            instantiations: null
        }
    }

    componentDidMount(){
        var params = new URLSearchParams(this.props.location.search);
        var taskID = params.get("taskID");
        var entityID = params.get("entityID");
        var datasetID = this.props.match.params.dataset;
        var explanationID = this.props.match.params.explanation;

        this.setState({
            datasetID: datasetID,
            explanationID: explanationID
        });

        API.getPredictionInfo(datasetID, explanationID, taskID, entityID, (res) => {
            this.setState({info: res});
        });
        API.getExplanations(datasetID, explanationID, taskID, entityID, (explanation) => {
            this.setState({explanation: explanation});
        });
    }

    getTailName(x){
        return x["tailLabel"] ? x["tailLabel"] : x["tail"]
    }

    getHeadName(x){
        return x["headLabel"] ? x["headLabel"] : x["head"]
    }

    getRelationName(x){
        return x["relationLabel"] ? x["relationLabel"] : x["relation"]
    }

    toId(x){
        return x.replace(/[^a-zA-Z0-9]/g, "_")
    }

    showInstantiations(rule){
        this.setState({
            selectedRule: rule,
            showInstantiations: true
        })

        const nodesX = rule.Definition.bodies.map(x => this.getHeadName(x));
        const nodesY = rule.Definition.bodies.map(x => this.getTailName(x));
        var nodes_ = new Set(nodesX.concat(nodesY))
        nodes_.add(this.getHeadName(rule.Definition))
        nodes_.add(this.getTailName(rule.Definition))
        nodes_ = [...nodes_]
        const nodes = nodes_.map(x => ({id: this.toId(x), label: x}))

        const edges = rule.Definition.bodies.map(x => ({from: this.toId(this.getHeadName(x)), to: this.toId(this.getTailName(x)), label: this.getRelationName(x)}))
        edges.push({from: this.toId(this.getHeadName(rule.Definition)), to: this.toId(this.getTailName(rule.Definition)), label: this.getRelationName(rule.Definition), color: {color: "#72bcd4"}, dashes: true})

        

        this.setState({
            graph: {
                nodes: nodes,
                edges: edges
            }
        })

        API.getInstantiations(this.state.datasetID, this.state.explanationID, rule["ID"], this.state.info.head.curie, this.state.info.tail.curie, (instantiations) => {
            this.setState({
                instantiations: instantiations
            });


            /*
            const nodesX = instantiations.map(x => this.getName(x[0]));
            const nodesY = instantiations.map(x => this.getName(x[1]));

            const edges = instantiations.map(x => ({from: this.getName(x[0]), to: this.getName(x[1]), label: ""}))

            const nodes_ = Set(nodesX.concat(nodesY))
            const nodes = nodes_.map(x => ({id: x.replace(/[^a-zA-Z0-9]/g, "_"), label: x}))



            var graph = {
                nodes: [],
                edges: []
            }

            instantiations.forEach((instantiation) => {

            })
            */
        });
    }

    render(){
        console.log(this.state.info)

        return (
            <div>
            {this.state.info ?
                <>
                <Container className="my-4">
                    <Row>
                        <Col>
                            <h2>
                                <a href={`/${this.state.datasetID}/${this.state.explanationID}/entity?term=${this.state.info.head.curie}`}>{this.state.info.head.label ? this.state.info.head.label : this.state.info.head.curie}</a>
                                &nbsp;
                                {this.state.info.relLabel? this.state.info.relLabel : this.state.info.rel }
                                &nbsp;
                                <a href={`/${this.state.datasetID}/${this.state.explanationID}/entity?term=${this.state.info.tail.curie}`}>{this.state.info.tail.label ? this.state.info.tail.label : this.state.info.tail.curie}</a>
                            </h2>
                        </Col>
                    </Row>
                    <Row>
                        <Col>
                            <h4 className="m-auto">Confidence: {this.state.info.confidence.toFixed(5)}</h4>
                        </Col>
                    </Row>
                    <Row>
                        <Col className="mt-4" >
                            <h2>
                                because
                            </h2>
                        </Col>
                    </Row>
                </Container>
                {this.state.explanation && this.state.info ?
                    this.state.explanation.length > 1 ? 
                        <Accordion defaultActiveKey="0" className="w-75 m-auto">
                        {this.state.explanation.map(cluster =>
                            <Card>
                                <CustomToggle eventKey={String(cluster["ID"])} confidence={cluster["Rules"][0]["Confidence"]} activeKey="0"/>
                                <Accordion.Collapse eventKey={String(cluster["ID"])}>
                                    <Cluster datasetID={this.state.datasetID} explanationID={this.state.explanationID} cluster={cluster} info={this.state.info} showInstantiations={(rule)=>this.showInstantiations(rule)}/>
                                </Accordion.Collapse>
                            </Card>
                        )}
                        </Accordion>
                    : <Cluster datasetID={this.state.datasetID} explanationID={this.state.explanationID} cluster={this.state.explanation[0]} info={this.state.info} showInstantiations={(rule)=>this.showInstantiations(rule)}/>
                : "" }
                <Modal show={this.state.showInstantiations} size="lg" onHide={() => {this.setState({instantiations: null, showInstantiations: false})}}>
                    <Modal.Header closeButton>
                    <Modal.Title>Details</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <h2>Rule</h2>
                        <hr/>
                        <div className="text-center">   
                            {this.state.selectedRule?
                            <Table style={{fontSize: "22px"}}>
                                <tbody>
                                    <tr>
                                        <td style={{textAlign: "right", verticalAlign: "middle", padding: "0px", borderWidth:"0px"}}>
                                            <span>
                                                {this.getRelationName(this.state.selectedRule.Definition) 
                                                + "(" + this.getHeadName(this.state.selectedRule.Definition) + "," + 
                                                this.getTailName(this.state.selectedRule.Definition) + ")"
                                                }
                                            
                                            </span>
                                        </td>
                                        <td style={{verticalAlign: "middle", padding: "0px", borderWidth:"0px"}}>
                                            <span>&lt;=</span>
                                        </td>
                                        <td style={{textAlign: "left", padding: "0px", borderWidth:"0px"}}>
                                            <div>
                                            {this.state.selectedRule.Definition.bodies.map(x => 
                                                    <div>{this.getRelationName(x) + "(" + this.getHeadName(x) + "," + this.getTailName(x) + ")"}</div>
                                            )}
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </Table>
                            : "" }
                        </div>
                        <VisNetwork data={this.state.graph}/>
                        <div className='text-center mx-3' style={{display: "flex", flexFlow: "row wrap", justifyContent: "space-between"}}>
                            <p style={{visibility: "hidden", fontSize: "12px"}}>(Interactive graph)</p>
                            <div>
                                <svg width="65" height="10" xmlns="http://www.w3.org/2000/svg">
                                    <g>
                                    <title>Layer 1</title>
                                    <path id="svg_1" d="m5,5l45,0" opacity="undefined" stroke-linecap="undefined" stroke-linejoin="undefined" stroke-dasharray="5,5" stroke="#72bcd4" fill="none"/>
                                    <path transform="rotate(90, 57.4167, 4.91667)" id="svg_3" d="m52.41667,10.41667l5,-11l5,11l-10.00001,0z" fill="#72bcd4"/>
                                    </g>
                                    </svg>
                                <p>Predicted</p>
                            </div>
                            <p style={{fontSize: "12px"}}>(Interactive graph)</p>
                        </div>
                        
                        <h2>Instantiations</h2>
                        <hr/>
                        <Table className="m-0 text-center mb-3">
                            <tbody>
                                <tr>
                                    <td className="w-25 border-top-0">
                                        <b><a href={`/${this.state.datasetID}/${this.state.explanationID}/entity?term=${this.state.info.head.curie}`}>{this.state.info.head.label ? this.state.info.head.label : this.state.info.tail.curie}</a></b>
                                    </td>
                                    <td className="w-50 border-top-0">
                                        {this.state.info.relLabel? this.state.info.relLabel : this.state.info.rel}
                                    </td>
                                    <td className="w-25 border-top-0">
                                        <b><a href={`/${this.state.datasetID}/${this.state.explanationID}/entity?term=${this.state.info.tail.curie}`}>{this.state.info.tail.label ? this.state.info.tail.label : this.state.info.tail.curie}</a></b>
                                    </td>
                                </tr>
                                <tr>
                                    <td className="text-center border-top-0" colSpan="3">
                                        <FaArrowRight/>
                                    </td>
                                </tr>
                            {this.state.selectedRule?.Definition.bodies.map((body) =>
                                        <tr>
                                            <td className="w-25 border-top-0">
                                                {(this.state.info.head && this.state.info.tail) ?
                                                    body.headLabel ? 
                                                        <a href={`/${this.state.datasetID}/${this.state.explanationID}/entity?term=${body.head}`}>{body.headLabel}</a> 
                                                    : body.head === "X" ? 
                                                        <a href={`/${this.state.datasetID}/${this.state.explanationID}/entity?term=${this.state.info.head.curie}`}>{this.state.info.head.label ? this.state.info.head.label : this.state.info.head.curie }</a>
                                                    : body.head === "Y" ? 
                                                        <a href={`/${this.state.datasetID}/${this.state.explanationID}/entity?term=${this.state.info.tail.curie}`}>{this.state.info.tail.label ? this.state.info.tail.label: this.state.info.tail.curie}</a>
                                                    : body.head
                                                    : "Hi"
                                                }
                                            </td>
                                            <td className="w-50 border-top-0">
                                                {body.relationLabel? body.relationLabel : body.relation}
                                            </td>
                                            <td className="w-25 border-top-0">
                                                {(this.state.info.head && this.state.info.tail) ?
                                                    body.tailLabel ? 
                                                        <a href={`/${this.state.datasetID}/${this.state.explanationID}/entity?term=${body.tail}`}>{body.tailLabel}</a> 
                                                    : body.tail === "X" ? 
                                                        <a href={`/${this.state.datasetID}/${this.state.explanationID}/entity?term=${this.state.info.head.curie}`}>{ this.state.info.head.label ? this.state.info.head.label : this.state.info.head.curie }</a>
                                                    : body.tail === "Y" ? 
                                                        <a href={`/${this.state.datasetID}/${this.state.explanationID}/entity?term=${this.state.info.tail.curie}`}>{ this.state.info.tail.label ? this.state.info.tail.label: this.state.info.tail.curie }</a>
                                                    : body.tail
                                                    : "Hi"
                                                }
                                            </td>
                                        </tr>
                            )}
                            </tbody>
                        </Table>
                        <Container className="text-center">
                                { this.state.instantiations ? 
                                this.state.instantiations.map((instantiation) =>
                                    <Row className="border-top py-2">
                                        {instantiation.map((variable) => 
                                            <>
                                            <Col>
                                                {variable.variable} = <a href={`/${this.state.datasetID}/${this.state.explanationID}/entity?term=${variable.curie}`}>{variable.label ? variable.label : variable.curie}</a>
                                            </Col>
                                            </>
                                        )}
                                    </Row>
                                )
                                : <Row><Col><Spinner animation="border" /></Col></Row> }
                        </Container>
                    </Modal.Body>
                    <Modal.Footer>
                    <Button variant="secondary" onClick={() => {this.setState({instantiations: null, showInstantiations: false})}}>
                        Close
                    </Button>
                    </Modal.Footer>
                </Modal>
                </>
            : "" }
        </div>
        );
    }
}

export const Explanation = withRouter(Explanation_);

function VisNetwork(props){
    const visJsRef = useRef(null);
    useEffect(() => {
        const options = {
            edges: {
                color: '#000000',
                arrows: "to"
            },
            height: "300px"
        };
    
        const events = {
            select: function(event) {
                console.log(event);
            }
        };
        console.log(props.nodes)
		const network =
			visJsRef.current &&
			new Network(visJsRef.current, props.data, options);
		// Use `network` here to configure events, etc
	}, [visJsRef, props.data]);

    return <div className="mx-3" style={{borderStyle: "solid", borderWidth: "1px", borderColor: "lightgray"}} ref={visJsRef} />;
};


function CustomToggle({eventKey, confidence, activeKey}) {
    const currentEventKey = useContext(AccordionContext);

    const decoratedOnClick = useAccordionToggle(eventKey);

    const isCurrentEventKey = currentEventKey === eventKey;

    return (
        <Card.Header onClick={decoratedOnClick}>
            <Table className="mb-0">
                <tr>
                    <td className="w-auto text-left border-top-0">
                        <IconContext.Provider value={{ size: "2em", className: "global-class-name" }}>
                            <div>
                                {isCurrentEventKey ? <RiArrowDropDownLine/> : <RiArrowDropRightLine/>}
                            </div>
                        </IconContext.Provider>
                    </td>
                    <td className="w-75 align-middle text-left border-top-0">
                        <h5 className="mb-0">Cluster</h5>
                    </td>
                    <td className="w-25 align-middle text-right border-top-0">
                        <h5 className="mb-0">{confidence.toFixed(5)}</h5>
                    </td>
                </tr>
            </Table>
        </Card.Header>
    );
  }

function Cluster({cluster, info, showInstantiations, datasetID, explanationID}){
    return (
        <Table className="w-auto m-auto">
            <thead>
                <tr>
                    <th className="align-middle">
                        Rule
                    </th>
                    <th className="align-middle">
                        Confidence
                    </th>
                    <th className="align-middle">
                        Correctly predicted
                    </th>
                    <th className="align-middle">
                        Predicted
                    </th>
                    <th/>
                </tr>
            </thead>
            <tbody> 
            {cluster["Rules"].map(rule =>
                <tr className="mb-2">
                    <td>
                        <Table className="m-0">
                            <tbody>
                            {rule.Definition.bodies.map((body) =>
                            /*
                                        <tr>
                                            <td className="w-25 border-top-0">
                                                {(info.head && info.tail) ?
                                                    body.headLabel ? 
                                                        <a style={{wordBreak: "break-word"}} href={'/entity?term=' + body.head}>{body.headLabel}</a> 
                                                    : body.head === "X" ? 
                                                        <b><a style={{wordBreak: "break-word"}} href={'/entity?term=' + info.head.curie}>{info.head.label ? info.head.label : info.head.curie}</a></b>
                                                    : body.head === "Y" ? 
                                                        <b><a  style={{wordBreak: "break-word"}} href={'/entity?term=' + info.tail.curie}>{info.tail.label ? info.tail.label : info.tail.curie}</a> </b>
                                                    : body.head
                                                    : ""
                                                }
                                            </td>
                                            <td className="w-50 border-top-0">
                                                {body.relationLabel}
                                            </td>
                                            <td className="w-25 border-top-0">
                                                {(info.head && info.tail) ?
                                                    body.tailLabel ? 
                                                        <a style={{wordBreak: "break-word"}} href={'/entity?term=' + body.tail}>{body.tailLabel}</a> 
                                                    : body.tail === "X" ? 
                                                        <b><a style={{wordBreak: "break-word"}} href={'/entity?term=' + info.head.curie}>{info.head.label ? info.head.label : info.head.curie}</a></b>
                                                    : body.tail === "Y" ? 
                                                        <b><a style={{wordBreak: "break-word"}} href={'/entity?term=' + info.tail.curie}>{info.tail.label ? info.tail.label : info.tail.curie}</a> </b> 
                                                    : body.tail
                                                    : ""
                                                }
                                            </td>
                                        </tr>
                            */
                                        <tr>
                                        <td className="w-100 border-top-0">
                                            {(info.head && info.tail) ?
                                                body.headLabel ? 
                                                    <a style={{wordBreak: "break-word"}} href={`/${datasetID}/${explanationID}/entity?term=` + body.head}>{ellipsis(body.headLabel)}</a> 
                                                : body.head === "X" ? 
                                                    <b><a style={{wordBreak: "break-word"}} href={`/${datasetID}/${explanationID}/entity?term=` + info.head.curie}>{ellipsis(info.head.label ? info.head.label : info.head.curie)}</a></b>
                                                : body.head === "Y" ? 
                                                    <b><a  style={{wordBreak: "break-word"}} href={`/${datasetID}/${explanationID}/entity?term=` + info.tail.curie}>{ellipsis(info.tail.label ? info.tail.label : info.tail.curie)}</a> </b>
                                                : body.head
                                                : ""
                                            }
                                            &nbsp;
                                            {body.relationLabel}
                                            &nbsp;
                                            {(info.head && info.tail) ?
                                                body.tailLabel ? 
                                                    <a style={{wordBreak: "break-word"}} href={`/${datasetID}/${explanationID}/entity?term=` + body.tail}>{ellipsis(body.tailLabel)}</a> 
                                                : body.tail === "X" ? 
                                                    <b><a style={{wordBreak: "break-word"}} href={`/${datasetID}/${explanationID}/entity?term=` + info.head.curie}>{ellipsis(info.head.label ? info.head.label : info.head.curie)}</a></b>
                                                : body.tail === "Y" ? 
                                                    <b><a style={{wordBreak: "break-word"}} href={`/${datasetID}/${explanationID}/entity?term=` + info.tail.curie}>{ellipsis(info.tail.label ? info.tail.label : info.tail.curie)}</a> </b> 
                                                : body.tail
                                                : ""
                                            }
                                        </td>
                                    </tr>
                            )}
                            </tbody>
                        </Table>
                    </td>
                    <td className="align-middle">
                        {rule["Confidence"].toFixed(5)}
                    </td>
                    <td className="align-middle">
                        {rule["CorrectlyPredicted"]}
                    </td>
                    <td className="align-middle">
                        {rule["Predicted"]}
                    </td>
                    <td className="align-middle">
                        <OverlayTrigger
                            key='top'
                            placement='top'
                            overlay={
                            <Tooltip id={`tooltip-top`}>
                                Details (Rule, Instantiations, ...)
                            </Tooltip>
                            }
                        >
                            <Button onClick={() => {showInstantiations(rule)}} className="p-1">
                                <IconContext.Provider value={{ size: "1.25em", className: "global-class-name" }}>
                                    <div>
                                        <HiOutlineDocumentSearch className="m-1"/>
                                    </div>
                                </IconContext.Provider>
                            </Button> 
                        </OverlayTrigger>
                    </td>
                </tr>
            )}
            </tbody>
        </Table>
    )

    
}