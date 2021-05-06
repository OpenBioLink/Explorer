import React, { useState, useEffect } from 'react';
import './App.css';
import {Button, Pagination} from 'react-bootstrap';
import {Card, Navbar, Form, FormControl, Dropdown, DropdownButton, ListGroup, Container, Row, Col} from 'react-bootstrap';
import { useHistory, useParams } from "react-router-dom";
import {ImSortAlphaDesc, ImSortAlphaAsc} from "react-icons/im";
import 'bootstrap/dist/css/bootstrap.min.css';
import { useHistoryState, useSessionState } from "./HistoryState";
import {tic, toc, sortAsc, sortDesc} from './util'
const API = require('./API');

export function Overview(){

    const history = useHistory();

    let { dataset, explanation } = useParams();

    return (
        <div style={{minHeight: "100vh"}} className="text-left">
            <Card className="my-2 mx-5">
                <Card.Header>Dataset</Card.Header>
                <Card.Body>
                    <Card.Title>{dataset}</Card.Title>
                    <Card.Text>
                    With supporting text below as a natural lead-in to additional content.
                    </Card.Text>
                </Card.Body>
                </Card>
            <Card className="my-2 mx-5">
                <Card.Header>Explanation</Card.Header>
                <Card.Body>
                    <Card.Title>{explanation}</Card.Title>
                    <Card.Text>
                    With supporting text below as a natural lead-in to additional content.
                    </Card.Text>
                </Card.Body>
            </Card>
        </div>
    );

}