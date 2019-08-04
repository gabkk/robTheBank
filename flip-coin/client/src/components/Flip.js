import React from "react";

class Flip extends React.Component{
  state = { sendAmountToBet: 0 };

  flip = async () => {
  	console.log("Inside flip");
  	console.log(this.props);
    const { accounts, contract, currentBank, web3 } = this.props;
    if (!isNaN(this.state.sendAmountToBet)){
      let bankBalance = 0;
      let userBalance = 0;
      let userHistory = 0;
      let gameStatus = "not play yet";
      try {
        await contract.methods.flip(currentBank).send({ from: accounts[0], value: parseInt(this.state.sendAmountToBet), gas: 900000});
        try {
          userHistory = await contract.methods.getUserHistory(accounts[0]).call();
          console.log("this is user historic" + userHistory);
        } catch (error){
          console.log("fail to get User balance");
        }
        try {
          const responseFlip = await contract.methods.getLastFlip(accounts[0]).call();
          // Update state with the result.
          if (responseFlip === true){
            gameStatus = "Win";
          }
          else {
            gameStatus = "Loose";
          }
        } catch (error){
            console.log("fail to get last flip");
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
        this.props.updateFromComponent({userFund: userBalance, lastFlip: gameStatus, userHistory: userHistory, bankFund: bankBalance});
      } catch (error){
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
  		<div>
	        <input type="text" name="value" defaultValue="0" onChange={ this.setAmount }/>
  			<button type="button" onClick={this.flip.bind(this)}>Flip</button>
  		</div>
  	);
  }
}

export default Flip;