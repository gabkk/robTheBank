import React, { Component } from "react";
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import 'bootstrap/dist/css/bootstrap.min.css';
import ReactLoading from 'react-loading';

//import FormControl from 'react-bootstrap/FormControl';


import RobTheBank from "./contracts/RobTheBank.json";
//import RobTheBank from "./contracts/RobTheBankRopsten.json";
import getWeb3 from "./utils/getWeb3";

import Flip from "./components/Flip";
import AppNotConnected from "./components/AppNotConnected";
import BankManagement from "./components/BankManagement";
import SelectBank from "./utils/SelectBank"
import {displayRobQuote} from "./utils/typeWriter.js"

import "./App.css";
import "./stylesheets/application.scss";
import image_gangster from "./images/gangster.jpg";
import image_bank from "./images/image_bank.jpg";


class App extends Component {
  constructor(props){
    super(props);
    this.state = {
      storageValue: 0,
      web3: null,
      accounts: null,
      contract: null,
      selectedBankFund: 0,
      selectedBankName: 'Default',
      userFund: 0,
      userHistory: 0,
      lastFlip: "not played yet !!! Try to rob a bank",
      myBankFund: 0,
      myBankName: null,
      theBankIsOracle: false,
      listOfBank: null,
      loading: false,
      displayWithraw: false,
      isBankOwner: false,
      isContractOwner: false,
      listOfBankObj: []
    }
    this.updateBankInfo = this.updateBankInfo.bind(this)
    this.updateInterface = this.updateInterface.bind(this);
    this.destroy = this.destroy.bind(this);
  };

  componentDidMount = async () => {
    try {

      // Get network provider and web3 instance.
      const web3 = await getWeb3();
      let accounts;
      try{
        // Use web3 to get the user's accounts.
        accounts = await web3.eth.getAccounts();
      } catch {
        console.log("accounts error");
      }

      // Get the contract instance.
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = RobTheBank.networks[networkId];
        const instance = new web3.eth.Contract(
          RobTheBank.abi,
          deployedNetwork && deployedNetwork.address
        );
      // Check if this user is the contract owner
      let owner = await instance.methods.owner().call();
      if (owner === accounts[0]){
        this.setState({isContractOwner: true});
      }

      let isBankOwner = false;
      try{
        isBankOwner = await instance.methods.isBankOwner(accounts[0]).call();
        this.setState({isBankOwner: isBankOwner});
      } catch(error){
        console.log("failed to get isBankOwner accounts[0] : " + error);
      }

      // Show the contract balance
      let userAmount = 0;
      await web3.eth.getBalance(accounts[0], (err, balance) => {
        userAmount =  web3.utils.fromWei(balance) + " ETH";
      });

      let listOfBank;
      try {
        listOfBank = await instance.methods.getListOfBank().call();
        console.log("componentDidMount List of Bank");
        console.log(listOfBank);
        this.setState({listOfBank: listOfBank});
        /*
        * bankObj
        * [0] = name (str)
        * [1] = amount of eth (str)
        * [2] isCreated (bool)
        */

        /* Get infos related to the first bank*/
        let initialAmount = 0;
        let selectedBankName = "Not set";
        try {
          let firstBankObj = await instance.methods.getBankInfos(listOfBank[0]).call();
          selectedBankName = firstBankObj[0];
          initialAmount = firstBankObj[1];
        } catch(error){
          console.log("failed to getBankInfos of listOfBank[0] : " + error);
        }

        /* Get infos related to the accounts bank if there is one*/
        let myBankFund = 0;
        let myBankName = "Not set";
        let isBankIsOracle = false;
        try{
          let myBankObj = await instance.methods.getBankInfos(accounts[0]).call();
          myBankName = myBankObj[0];
          myBankFund = myBankObj[1];
          isBankIsOracle = myBankObj[3];
          this.setState({isBankOwner: isBankOwner,
                          myBankFund: myBankFund,
                          myBankName: myBankName,
                          theBankIsOracle: isBankIsOracle});
        } catch(error){
          console.log("failed to getBankInfos of accounts[0] : " + error);
        }

        let displayWithraw = false;
        if(listOfBank && listOfBank[0] === accounts[0] && initialAmount !== 0){
          displayWithraw = true;
        }

        // WIP Retreive all the bank event to get name and Balance
        try {
          await instance.methods.getListOfBankObj().call();
          try {
            //TODO Improve this !!!!!!!!
            await instance.getPastEvents(['LogListOfBank'], {fromBlock: 0, toBlock: 'latest'},
              async (err, events) => {
                var listOfBankObj = [];
                for(let i=0; i<events.length;i++){
                  if(events[i].event === "LogListOfBank"){
                    var obj={};
                    obj.name = events[i].returnValues.name;
                    obj.address = events[i].returnValues.addr;
                    obj.balance = events[i].returnValues.balance;
                    obj.isOracle = events[i].returnValues.isOracle;
                    listOfBankObj = listOfBankObj.concat({obj});
                  }
                }
                this.setState(state => {
                  return {
                    listOfBankObj
                  };
                });
              }
            )
          } catch (error){
            console.log("No past event in getListOfBank");
          }
        } catch (error){
          console.log("Get list of bank OBJ failed");
        }

        const userHistory = await instance.methods.getUserHistory(accounts[0]).call();

        // Set web3, accounts, and contract to the state, and then proceed with an
        // example of interacting with the contract's methods.

        this.setState({ web3,
                        accounts,
                        contract: instance,
                        selectedBankFund: initialAmount,
                        selectedBankName: selectedBankName,
                        userFund: userAmount,
                        userHistory: userHistory,
                        listOfBank: listOfBank,
                        displayWithraw: displayWithraw,
                        currentBank: listOfBank[0],
                      });

        // Loop To catch user wallet changes
        setInterval(async () => {
          let newAccount = await web3.eth.getAccounts(); ;
          if (newAccount[0] !== this.state.accounts[0]) {
            this.updateInterface(newAccount);
          }
        }, 1000);
      } catch(error) {
        console.log("Failed to communicate with the smart contract instance first call");
        console.log("Try to connect metamask and refresh your page.");
      }

    } catch (error) {
      // Catch any errors for any of the above operations.
      console.log("Failed to load web3, accounts, or contract. Check console for details.");
      console.error(error);
    }
    displayRobQuote();
  };

  destroy = async () =>{
    let ret = await this.state.contract.methods.destroyContract().send({from: this.state.accounts[0]});
    console.log(ret);
  };

  updateInterface = async (accounts) =>{
    /*
    * Add a pop  up to show user change account
    */
    let owner = await this.state.contract.methods.owner().call();
    if (owner === accounts[0]){
      this.setState({isContractOwner: true});
    } else{
      this.setState({isContractOwner: false});
    }
    let isBankOwner;
    try{
      isBankOwner = await this.state.contract.methods.isBankOwner(accounts[0]).call();
    } catch(error){
      console.log("failed to get isBankOwner accounts[0] : " + error);
    }
    this.setState({isBankOwner: isBankOwner})
    if(isBankOwner){
      this.setState({displayWithraw: true});
    } else {
      this.setState({displayWithraw: false});
    }

    if(accounts[0] !== this.state.accounts[0]){
      // Check if this user is the contract owner
      try{
        let userAmount = 0;
        await this.state.web3.eth.getBalance(accounts[0], (err, balance) => {
          userAmount =  this.state.web3.utils.fromWei(balance) + " ETH";
        });
        this.setState({ userFund: userAmount, accounts: accounts});
      } catch (error){
        console.log("fail to get user balance"+error);
      }
            /* Get infos related to the accounts bank if there is one*/ 
      try {
        let userHistory = await this.state.contract.methods.getUserHistory(accounts[0]).call();
        this.setState({userHistory: userHistory});
      } catch (error){
        console.log("fail to get User balance");
      }
    }
  }

  /*
  * Called when the user change the selected bank
  */
  updateBankInfo = async(event) => {
    const { contract } = this.state;
    let setBankIndex = event.target.value;
    let listOfBank;
    try {
      listOfBank = await contract.methods.getListOfBank().call();
      console.log("updateBankInfo List of Bank");
      console.log(listOfBank);
      this.setState({listOfBank: listOfBank});
    } catch (error){
      console.log("list of bank empty");
    }

    /*Get info about the selecte bank*/
    try{
      let theBankObj = await contract.methods.getBankInfos(listOfBank[setBankIndex]).call();
      console.log(theBankObj);
      this.setState({selectedBankName: theBankObj[0],
                      selectedBankFund: theBankObj[1],
                      theBankIsOracle: theBankObj[3],
                      currentBank: listOfBank[setBankIndex]});
    } catch(error){
      console.log("failed to getBankInfos of accounts[0] : " + error);
    }
  }

  updateFromComponent(...newStateValue){
    if (newStateValue[0].bankFund){
      this.setState({selectedBankFund: newStateValue[0].bankFund});
    }
    this.setState(newStateValue[0]);
  }

  render() {
    if (!this.state.web3 || !this.state.listOfBankObj) {
      return (
        <AppNotConnected/>
      );
    } else {
    return (
      <div className="app">
        <Navbar collapseOnSelect expand="lg" bg="dark" variant="dark">
          <Navbar.Brand href="#home">Rob The Bank</Navbar.Brand>
          <Navbar.Toggle aria-controls="responsive-navbar-nav" />
          <Navbar.Collapse id="responsive-navbar-nav">
            <Nav className="mr-auto">
              <Nav.Link href="#comingSoon">swarm version</Nav.Link>
              <Nav.Link href="#info">Info</Nav.Link>
            </Nav>
            <Nav>
              {this.state.isContractOwner &&
                <Nav.Link><button type="button" className="btn btn-danger" onClick={this.destroy.bind(this)}>Destroy</button></Nav.Link>
              }
              <Nav.Link>Balance of your wallet: {this.state.userFund}</Nav.Link>
              <Nav.Link>Account: {this.state.accounts[0]}</Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Navbar>
        <div className="bankManagement">
          <BankManagement
                web3={this.state.web3}
                accounts={this.state.accounts}
                myBankFund={this.state.myBankFund}
                contract={this.state.contract}
                currentBank={this.state.currentBank}
                displayWithraw={this.state.displayWithraw}
                isBankOwner={this.state.isBankOwner}
                myBankName={this.state.myBankName}
                listOfBankObj={this.state.listOfBankObj}
                updateFromComponent={this.updateFromComponent.bind(this)} />

        </div>
        <div className="RobQuote">
          <p id="RobText"></p>
          <p id="RobText2"></p>
        </div>
        <div className="gameContainer">
          {this.state.listOfBankObj ? (
          <div className="bank">
            <SelectBank items={this.state.listOfBankObj}
                        value={this.state.activity}
                        onSelect={this.updateBankInfo}
            />
            <div>Bank Balance {this.state.web3.utils.fromWei(this.state.selectedBankFund, "ether")} Eth
            </div>
            <img src={image_bank} alt="image_bank" />
            <div id="loadingRoberyTitle">Robbery not started</div>
            {this.state.loading &&
                <ReactLoading className="loadingRobbery" type={"cylon"} color={"#071134"} height={50} width={50} />
            }
          </div>
          ):(
          <div>
          </div>
          )}

          <div className="gameInteraction">
            <h5> You have {this.state.lastFlip}</h5>
            <h5>History: {this.state.web3.utils.fromWei(this.state.userHistory, "ether")} Eth</h5>
            <img src={image_gangster} alt="image_gangster" />
            <Flip 
                  loading={this.state.loading}
                  accounts={this.state.accounts}
                  contract={this.state.contract}
                  currentBank={this.state.currentBank}
                  web3={this.state.web3}
                  theBankIsOracle={this.state.theBankIsOracle}
                  updateFromComponent={this.updateFromComponent.bind(this)} />
          </div>
        </div>
      </div>
    );
    }
  }
}

export default App;
