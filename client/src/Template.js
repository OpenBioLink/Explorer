import React from 'react';
import PropTypes from "prop-types";
import { withRouter } from "react-router";
import './App.css';
import {Button} from 'react-bootstrap';
const util = require('./Util');

export class Task_ extends React.Component{

    static propTypes = {
        match: PropTypes.object.isRequired,
        location: PropTypes.object.isRequired,
        history: PropTypes.object.isRequired
      };

    constructor(){
        super();
        this.state = {
        }
    }

    componentDidMount(){
        var params = new URLSearchParams(this.props.location.search);
        var curie = params.get("id");
    }

    render(){
        return (

            <div>
            </div>
        );
    }
}

export const Task = withRouter(Task_);