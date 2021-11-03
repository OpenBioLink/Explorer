import React from 'react';
import PropTypes from "prop-types";
import { withRouter } from "react-router";
import './App.css';
import {Button} from 'react-bootstrap';
import {FaGithub} from 'react-icons/fa';
import {GrMail} from 'react-icons/gr';
export class Feedback_ extends React.Component{

    static propTypes = {
        match: PropTypes.object.isRequired,
        location: PropTypes.object.isRequired,
        history: PropTypes.object.isRequired
      };

    render(){
        return (

            <div>
                <div className="mt-5">
                    We would be very happy to hear your feedback about this project. Below you can find several ways to contact us:
                </div>
                <div className="mt-3">
                    <a href="https://github.com/OpenBioLink/Explorer/issues/new"><Button variant="dark" className="w-25">Github <FaGithub/></Button></a>
                </div>
                <div className="mt-2">
                    <a href="javascript:linkTo_UnCryptMailto('nbjmup;tjnpo/puuAnfevojxjfo/bd/bu');"><Button  variant="dark" className="w-25">Email <GrMail/></Button></a>
                </div>
            </div>
        );
    }
}

export const Feedback = withRouter(Feedback_);