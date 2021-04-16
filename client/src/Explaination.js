import React, {useState, useEffect} from 'react';
import { useAccordionToggle } from "react-bootstrap/AccordionToggle";
import PropTypes from "prop-types";
import { withRouter } from "react-router";
import './App.css';
import {Container, Row, Col, ListGroup, Table, Accordion, Card, Button} from 'react-bootstrap';
import { IconContext } from "react-icons";
import { RiArrowDropDownLine, RiArrowDropRightLine } from "react-icons/ri";
import Cookies from 'universal-cookie';
 
const cookies = new Cookies();
const API = require('./API');

export class Explaination_ extends React.Component{

    static propTypes = {
        match: PropTypes.object.isRequired,
        location: PropTypes.object.isRequired,
        history: PropTypes.object.isRequired
      };

    constructor(){
        super();
        this.state = {
            task: null,
            entityInfo: null,
            predictionInfo: null,
            X: null,
            Y: null,
            explaination: null
        }
    }

    componentDidMount(){
        var params = new URLSearchParams(this.props.location.search);
        var taskID = params.get("taskID");
        var entityID = params.get("entityID");
        API.getTaskByID(cookies.get('explainationID'), taskID, (task) => {
            API.getInfoByEntityID(cookies.get('datasetID'), cookies.get('explainationID'), task[0]["EntityID"], (entityInfo) => {
                API.getInfoByEntityID(cookies.get('datasetID'), cookies.get('explainationID'), entityID, (predictionInfo) => {
                    var X,Y = null;
                    if(task[0]["IsHead"] === 1){
                        X = entityInfo.Label ? entityInfo.Label : entityInfo.Curie;
                        Y = predictionInfo.Label ? predictionInfo.Label : predictionInfo.Curie; 
                    } else {
                        X = predictionInfo.Label ? predictionInfo.Label : predictionInfo.Curie; 
                        Y = entityInfo.Label ? entityInfo.Label : entityInfo.Curie;
                    }
                    this.setState({
                        task: task[0],
                        entityInfo : entityInfo,
                        predictionInfo: predictionInfo,
                        X: X,
                        Y: Y
                    });
                });
            });
        });
        API.getExplainations(cookies.get('datasetID'), cookies.get('explainationID'), taskID, entityID, (explaination) => {
            console.log(explaination);
            this.setState({explaination: explaination});
        });
    }

    render(){
        return (
            <div>
            <Container className="my-2">
                <Row>
                    <Col>
                        <h2>{this.state.X ? this.state.X : ""}</h2>
                    </Col>
                    <Col>
                        <h2>{this.state.task ? this.state.task.RelationName : ""}</h2>
                    </Col>
                    <Col>
                        <h2>{this.state.Y ? this.state.Y : ""}</h2>
                    </Col>
                </Row>
            </Container>
                <Accordion defaultActiveKey="0" className="w-75 m-auto">
                {this.state.explaination ? 
                this.state.explaination.map(cluster =>
                        <Card>
                            <CustomToggle eventKey={String(cluster["ID"])} confidence={cluster["Rules"][0]["Confidence"]} />
                            <Accordion.Collapse eventKey={String(cluster["ID"])}>
                                <Table className="w-auto m-auto"> 
                                    {cluster["Rules"].map(rule =>
                                        <tr className="mb-2">
                                            <td>
                                                <Table>
                                                    {rule.Definition.bodies.map((body) =>
                                                                <tr>
                                                                    <td className="w-25 border-top-0">
                                                                        {(this.state.X && this.state.Y) ?
                                                                            body.headLabel ? 
                                                                                body.headLabel 
                                                                            : body.head === "X" ? 
                                                                                <b>{this.state.X}</b>
                                                                            : body.head === "Y" ? 
                                                                                <b>{this.state.Y}</b>
                                                                            : body.head
                                                                            : body.head
                                                                        }
                                                                    </td>
                                                                    <td className="w-50 border-top-0">
                                                                        {body.relation}
                                                                    </td>
                                                                    <td className="w-25 border-top-0">
                                                                        {(this.state.X && this.state.Y) ?
                                                                            body.tailLabel ? 
                                                                                body.tailLabel 
                                                                            : body.tail === "X" ? 
                                                                                <b>{this.state.X}</b>
                                                                            : body.tail === "Y" ? 
                                                                                <b>{this.state.Y}</b> 
                                                                            : body.tail
                                                                            : body.tail
                                                                        }
                                                                    </td>
                                                                </tr>
                                                    )}
                                                    </Table>
                                            </td>
                                            <td>
                                                {rule["Confidence"]}
                                            </td>
                                        </tr>
                                    )}
                                    </Table>
                            </Accordion.Collapse>
                        </Card>
                )
                : "" }
                </Accordion>
        </div>
        );
    }
}

export const Explaination = withRouter(Explaination_);


function CustomToggle({eventKey, clusterID, confidence}) {
    
    const [toggle, setToggle] = useState(false);

    const decoratedOnClick = useAccordionToggle(eventKey, () =>
        setToggle(!toggle)
    );

  
    return (
        <Card.Header onClick={decoratedOnClick}>
            <Table className="mb-0">
                <tr>
                    <td className="text-left border-top-0">
                        <IconContext.Provider value={{ size: "2em", className: "global-class-name" }}>
                            <div>
                                {toggle ? <RiArrowDropRightLine/> : <RiArrowDropDownLine/>}
                            </div>
                        </IconContext.Provider>
                    </td>
                    <td className="text-left border-top-0">
                        <h5 className="mb-0">Cluster</h5>
                    </td>
                    <td className="text-right border-top-0">
                        <h5 className="mb-0">{confidence}</h5>
                    </td>
                </tr>
            </Table>
        </Card.Header>
    );
  }