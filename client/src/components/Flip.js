import React from "react";
import eth_icon from "../images/eth_icon.png";

class Flip extends React.Component{
  state = { sendAmountToBet: "0.1" };

  flip = async () => {
    const { accounts, contract, currentBank, web3 } = this.props;
    if (!isNaN(this.state.sendAmountToBet)){
      let bankBalance = 0;
      let userBalance = 0;
      let userHistory = 0;
      var gameStatus = "not play yet";
      
      /*Modify the message value when a robing is started*/
      let el = document.getElementById("loadingRoberyTitle");
      el.innerHTML = "Robbery in progress";

      var amountInWei = web3.utils.toWei(this.state.sendAmountToBet, "ether");
      try {
        
        this.props.updateFromComponent({loading: true});
        var responseFlip = await contract.methods.flip(currentBank).send({ from: accounts[0], value: parseInt(amountInWei), gas: 70000});
        if (responseFlip.events.ReturnValue.returnValues[0] === true){
          gameStatus = "Win";
        }
        else {
          gameStatus = "Loose";
        }
        try {
          userHistory = await contract.methods.getUserHistory(accounts[0]).call();
        } catch (error){
          console.log("fail to get User balance");
        }
        try {
          bankBalance = await contract.methods.getBankBalance(currentBank).call();
        } catch (error){
          console.log("fail to get Bank balance");
        }
        try{
          userBalance = await web3.eth.getBalance(accounts[0]);
          userBalance = web3.utils.fromWei(userBalance) + " ETH"
        } catch(error){
          console.log("fail to get user balance");
        }
        /*
		    * Send the result of the new state to the parent component
        */
        el.innerHTML = "Robbery Done !!";
        this.props.updateFromComponent({loading: false,
                                        userFund: userBalance,
                                        lastFlip: gameStatus,
                                        userHistory: userHistory,
                                        bankFund: bankBalance});
      } catch (error){
        el.innerHTML = "Robbery Failed";
        this.props.updateFromComponent({loading: false});
        console.log("error When fliping"+ error);
      } 
    }
  };

  setAmount = e => {
  if (e.target.name === "value"){
      this.setState({ sendAmountToBet: e.target.value });
    }
  };

  render(){
    return(
      <div className="actionRob">
        <p>Enter the value you want to rob (or loose)</p>
        <div className="enterValue">
          <img className="eth_icon" src={eth_icon} alt="eth_icons" />
          <input type="text" name="value" defaultValue="0.1" onChange={ this.setAmount }/>
          <p className="eth_text">Eth</p>
        </div>
        <button type="button" id="robItButton" onClick={this.flip.bind(this)}>Rob It !</button>
      </div>
    );
  }
}

export default Flip;