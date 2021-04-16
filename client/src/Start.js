import React from 'react';
import PropTypes from "prop-types";
import { withRouter } from "react-router";
import './App.css';
import {Button} from 'react-bootstrap';

class Start_ extends React.Component{

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
    }

    render(){
        return (

            <div>
                Under construction...
            </div>
        );
    }
}

export const Start = withRouter(Start_);