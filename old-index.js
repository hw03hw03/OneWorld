import React from 'react';
import AppViews from './views/AppViews.js';
import DeployerViews from './views/DeployerViews.js';
import AttacherViews from './views/AttacherViews.js';
import {renderDOM, renderView} from './views/render.js';
import './index.css';
import * as backend from './build/index.main.mjs';
import { loadStdlib } from '@reach-sh/stdlib';
const reach = loadStdlib(process.env);

import { ALGO_MyAlgoConnect as MyAlgoConnect } from '@reach-sh/stdlib';
reach.setWalletFallback(reach.walletFallback({
  providerEnv: 'TestNet', MyAlgoConnect }));

// declare constants
const intToOutcome = ['Admin receives funds', 'Company recieves funds'];
const {standardUnit} = reach;
const defaults = {defaultFundAmt: '10', defaultWager: '0', standardUnit};

class App extends React.Component {
    // state based views
    constructor(props) {
        super(props);
        this.state = {view: 'ConnectAccount', ...defaults};
    }
    async componentDidMount() {
        const acc = await reach.getDefaultAccount();
        console.log(acc);
        const balAtomic = await reach.balanceOf(acc);
        const bal = reach.formatCurrency(balAtomic, 4);
        console.log(bal);
        //this.setState(acc);
        this.setState({acc, bal});
        if(await reach.canFundFromFaucet()){
            this.setState({view: 'FundAccount'});
        } else {
            this.setState({view: 'DeployerOrAttacher'});
        }
    }
    async fundAccount(fundAmount) {
        await reach.fundFromFaucet(this.state.acc, reach.parseCurrency(fundAmount));
        this.setState({view: 'DeployerOrAttacher'});
    }
    async skipFundAccount() {this.setState({view: 'DeployerOrAttacher'}); }
    selectAttacher() {this.setState({view: 'Wrapper', ContentView: Attacher});}
    selectDeployer() {this.setState({view: 'Wrapper', ContentView: Deployer});}
    render() { return renderView(this, AppViews);}
}

// Shared
class Shared extends React.Component {
    //these are the function definitions
    // these mirror the front end
    random() { return reach.hasRandom.random(); }
    seeOutcome(i) { this.setState({view: 'Done', outcome: intToOutcome[i]});}
    informTimeout() {this.setState({view: 'Timeout'}); }
}

class Deployer extends Shared {
    constructor(props) {
        super(props);
        this.state = {view: 'SetCost'};
    }
    async getCost() {
        const cost = await new Promise(resolveHandP => {
            this.setState({view: 'GetCost', resolveHandP});
        });
        this.setState({view: 'WaitingForResults'});
        return cost;
    }
    setCost(cost) {this.setState({view: 'Deploy', cost});}
    async deploy() {
        const ctc = this.props.acc.contract(backend);
        console.log(ctc);
        this.setState({view: 'Deploying', ctc});
        this.cost = reach.parseCurrency(this.state.cost);
        this.deadline = {ETH: 1000, ALGO: 100, CFX: 1000}[reach.connector];
        backend.Alice(ctc, this);
        const ctcInfoStr = JSON.stringify(await ctc.getInfo(), null, 2);
        console.log(ctcInfoStr);
        //this.setState({view: 'WaitingForAttacher', ctcInfoStr});
        this.setState({view: 'WaitingForAttacher', ctcInfoStr});
        console.log('Here6');
    }
    render() { return renderView(this, DeployerViews); }
    // this is the end of Deployer
}

// Attacher
class Attacher extends Shared {
    constructor(props) {
        super(props);
        this.state = {view: 'Attach'};
    }
    attach(ctcInfoStr) {
        const ctc = this.props.acc.contract(backend, JSON.parse(ctcInfoStr));
        this.setState({view: 'Attaching'});
        backend.Bob(ctc, this);
    }
    async termsAccepted(wagerAtomic){
        const cost = reach.formatCurrency(wagerAtomic, 4);
        return await new Promise(resolveAcceptedP => {
            this.setState({view: 'AcceptTerms', cost, resolveAcceptedP});
        });
    }
    termsAccepted() {
        this.state.resolveAcceptedP();
        this.setState({view: 'WaitingForTurn'});
    }
    render() { return renderView(this, AttacherViews);}
}
renderDOM(<App />);
