import React, {useContext} from 'react';
import PropTypes from "prop-types";
import { withRouter } from "react-router";
import { useAccordionToggle } from "react-bootstrap/AccordionToggle";
import './App.css';
import {Button, Pagination, Modal, Badge, Container, Row, Col, Table, ListGroup, Spinner, Accordion, AccordionContext, Card, OverlayTrigger, Tooltip} from 'react-bootstrap';
import { IconContext } from "react-icons";
import { RiArrowDropDownLine, RiArrowDropRightLine } from "react-icons/ri";
import { BiLinkExternal } from "react-icons/bi";
import { AiOutlineInfoCircle } from "react-icons/ai"
import API from "api";

export class Entity_ extends React.Component{

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
            curie: null,
            info: null,
            tailTasks: [],
            headTasks: [],
            incomingEdges: null,
            outgoingEdges: null
        }
    }

    componentDidMount(){
        var params = new URLSearchParams(this.props.location.search);
        var datasetID = this.props.match.params.dataset;
        var explanationID = this.props.match.params.explanation;
        var curie = params.get("term");
        this.setState({
            datasetID: datasetID,
            explanationID: explanationID,
            curie: curie
        });
        API.getInfoByCurie(datasetID, curie, (info) => this.setState({info: info}));
        API.getTasksByCurie(datasetID, explanationID, curie, (tasks) => this.addTasks(tasks));
    }

    loadIncomingEdges(){
        if(!this.state.incomingEdges){
            API.getIncomingEdges(this.state.datasetID, this.state.curie, (incoming) => {this.setState({incomingEdges: incoming})});
        }
    }

    loadOutgoingEdges(){
        if(!this.state.outgoingEdges){
            API.getOutgoingEdges(this.state.datasetID, this.state.curie, (outgoing) => this.setState({outgoingEdges: outgoing}));
        }
    }

    addTasks(tasks) {
        var headTasks = [];
        var tailTasks = [];
        for(var i = 0; i < tasks.length; i++){
            if(tasks[i]["IsHead"] === 1){
                headTasks.push(tasks[i]);
            } else {
                tailTasks.push(tasks[i]);
            }
        }
        this.setState({
            headTasks: headTasks,
            tailTasks: tailTasks
        });
    }

    onRelationSelection(taskID){
        this.props.history.push(`/${this.state.datasetID}/${this.state.explanationID}/task?taskID=${taskID}`);
    }

    /*

                        <Row>
                            <Col>
                                <h5>Description</h5>
                            </Col>
                        </Row>
                        <Row>
                            <Col>
                                {this.state.info?.Description ? this.state.info?.Description : ""}
                            </Col>
                        </Row>
    */

    render(){
        return (
            
            <div>
                <Modal.Dialog className="w-none w-75 mw-100">
                <Modal.Header className="justify-content-center">
                    <Table className="m-0" borderless>
                        <tbody>
                            <tr>
                                <td className="p-0">
                                <h2>
                                {this.state.info? this.state.info.Labels? this.state.info.Labels.map((label)=>
                                    <Badge className="m-1" variant="secondary">{label}</Badge>
                                ) : "" : "" }
                                </h2>
                                </td>
                            </tr>
                            <tr>
                                <td className="p-0">
                                    <h2>{this.state.info?.Curie} {this.state.info?.Label ? ": " + this.state.info?.Label : ""} </h2>
                                </td>
                            </tr>
                        </tbody>
                    </Table>
                </Modal.Header>
                <Modal.Body>
                    <Container fluid className="text-left">
                        { (this.state.info != undefined && this.state.info.Synonyms.length > 0) ? 
                            [
                            <Row>
                                <Col>
                                    <h4 className="mt-2">Synonyms</h4>
                                </Col>
                            </Row>,
                            <Row>
                                <Col>
                                    {this.state.info.Synonyms.join(", ")}
                                </Col>
                            </Row>
                            ]
                            : ""
                        }
                        <Row>
                            <Col>
                                <h4 className="pb-1 mt-2 underlinedHeading">Description</h4>
                            </Col>
                        </Row>
                        <Row>
                            <Col>
                            {
                                this.state.info ?
                                <>
                                    {this.state.info?.Description}
                                </>
                                : ""
                            }
                            </Col>
                        </Row>
                        <Row>
                            <Col>
                                <h4 className="pb-1 mt-2 underlinedHeading">Online Resource</h4>
                            </Col>
                        </Row>
                        <Row>
                            <Col>
                            {
                                this.state.info ?
                                <>
                                    <a href={this.state.info?.FullURI} target="_blank">
                                        {this.state.info?.FullURI}
                                    </a>
                                </>
                                 : ""
                            }
                            </Col>
                        </Row>
                        <Row>
                            <Col className="pr-0">
                                <h4 className="pb-1 mt-2 pr-0 underlinedHeading">Predictions</h4>
                            </Col>
                            <Col xs="auto" className="px-0 mb-2 underlinedHeading" style={{marginRight: "15px"}}>
                                <OverlayTrigger
                                    key='top'
                                    placement='top'
                                    overlay={
                                    <Tooltip id={`tooltip-top`}>
                                        Predictions made for this entity. Only relations for which at least one entity was predicted are shown.
                                    </Tooltip>
                                    }
                                >
                                    <AiOutlineInfoCircle className="mr-2 mt-3"/>
                                </OverlayTrigger>
                            </Col>
                        </Row>
                        <Row>
                            <Col>
                                {this.state.tailTasks.length > 0 ? <h5  className="underlinedHeading">Heads</h5> : ""}
                            </Col>
                            <Col>
                                {this.state.headTasks.length > 0 ? <h5  className="underlinedHeading">Tails</h5> : ""}
                            </Col>
                        </Row>
                        <Row>
                            <Col className="text-center">
                                {this.state.tailTasks.map(row =>
                                    <Button id={row["TaskID"]} className='Relation-btn w-100 mb-1' variant="dark" onClick={() => this.onRelationSelection(row["TaskID"])}>
                                        <table className="w-100">
                                            <tbody>
                                                <tr>
                                                    <td className="w-25">
                                                        ?
                                                    </td>
                                                    <td className="w-50">
                                                        {row["RelationLabel"]? row["RelationLabel"] : row["RelationName"]}
                                                    </td>
                                                    <td  className="w-25">
                                                        {this.state.info?.Label ? this.state.info?.Label : this.state.info?.Curie}
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </Button>
                                )}
                            </Col>
                            <Col className="text-center">
                                {this.state.headTasks.map(row =>
                                    <Button id={row["TaskID"]} className='Relation-btn w-100 mb-1' variant="dark" onClick={() => this.onRelationSelection(row["TaskID"])}>
                                        <table className="w-100">
                                            <tbody>
                                                <tr>
                                                    <td className="w-25">
                                                        {this.state.info?.Label ? this.state.info?.Label : this.state.info?.Curie}
                                                    </td>
                                                    <td className="w-50">
                                                        {row["RelationLabel"]}
                                                    </td>
                                                    <td  className="w-25">
                                                        ?
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </Button>
                                )}
                            </Col>
                        </Row>
                        <Row>
                            <Col>
                                <h4 className="pb-1 mt-2 underlinedHeading">Known links</h4>
                            </Col>
                        </Row>
                        <Row>
                            <Col>
                                <Accordion>
                                    <Card> 
                                        <CustomToggle eventKey="outgoing" label="Outgoing edges" load={() => {this.loadOutgoingEdges()}}/>
                                        <Accordion.Collapse eventKey="outgoing">
                                            <Table className="mb-2">
                                                <tbody>
                                                    {this.state.outgoingEdges ?
                                                        Object.entries(this.state.outgoingEdges).length > 0 ?
                                                        Object.entries(this.state.outgoingEdges).map(rel =>
                                                        <>
                                                            {rel[1].map(obj => 
                                                            <tr>
                                                                <td className="w-50 text-left border-right">
                                                                    {obj[0]}
                                                                </td>
                                                                <td className="w-50 text-center">
                                                                    <a href={`/${this.state.datasetID}/${this.state.explanationID}/entity?term=${obj[2]}`}>{obj[1] ? obj[1] : obj[2]}</a>
                                                                </td>
                                                            </tr>
                                                            )}
                                                        </>)
                                                    : <p className="mt-3 text-center">No outgoing edges</p>
                                                    : <tr><td className="text-center"><Spinner animation="border" /></td></tr> }
                                                </tbody>
                                            </Table>
                                        </Accordion.Collapse>
                                    </Card>
                                </Accordion>
                            </Col>
                        </Row>
                        <Row>
                            <Col>
                                <Accordion className="mt-2">
                                    <Card> 
                                        <CustomToggle eventKey="incoming" label="Incoming edges" load={() => {this.loadIncomingEdges()}}/>
                                        <Accordion.Collapse eventKey="incoming">
                                            <Table className="mb-2">
                                                <tbody>
                                                    {this.state.incomingEdges ?
                                                        Object.entries(this.state.incomingEdges).length > 0 ?
                                                            Object.entries(this.state.incomingEdges).map(rel =>
                                                            <>
                                                                {rel[1].map(obj => 
                                                                <tr>
                                                                    <td className="w-50 border-right text-center">
                                                                        <a href={`/${this.state.datasetID}/${this.state.explanationID}/entity?term=${obj[2]}`}>{obj[1] ? obj[1] : obj[2]}</a>
                                                                    </td>
                                                                    <td className="w-50 text-right">
                                                                        {obj[0]}
                                                                    </td>
                                                                </tr>
                                                                )}
                                                            </>)
                                                        : <p className="mt-3 text-center">No incoming edges</p>
                                                    : <tr><td className="text-center"><Spinner animation="border" /></td></tr> }
                                                </tbody>
                                            </Table>
                                        </Accordion.Collapse>
                                    </Card>
                                </Accordion>
                            </Col>
                        </Row>
                    </Container>
                </Modal.Body>
                </Modal.Dialog>
            </div>
        );
    }
}

export const Entity = withRouter(Entity_);


function CustomToggle({eventKey, label, load, activeKey}) {
    const currentEventKey = useContext(AccordionContext);

    const decoratedOnClick = useAccordionToggle(eventKey, load);

    const isCurrentEventKey = currentEventKey === eventKey;

    return (
        <Card.Header onClick={decoratedOnClick}>
            <Table className="mb-0 w-auto">
                <tr>
                    <td className="text-left border-top-0 align-middle p-0">
                        <IconContext.Provider value={{ size: "2em", className: "global-class-name" }}>
                            <div>
                                {isCurrentEventKey ? <RiArrowDropDownLine/> : <RiArrowDropRightLine/>}
                            </div>
                        </IconContext.Provider>
                    </td>
                    <td className="text-left border-top-0 align-middle p-0">
                        {label}
                    </td>
                </tr>
            </Table>
        </Card.Header>
    );
  }