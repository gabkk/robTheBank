import React from "react";
import "../stylesheets/application/_select.scss"

class SelectBank extends React.Component{
  componentDidMount(props){
  }

    render(){
      return (
      <div className="selectContainer">
        <div include="form-input-select()">
          <select value={this.props.value}
                  name={this.props.name}
                  onChange={this.props.onSelect}>
              {this.props.items.map((subItem,index) =>{
              return <option key={subItem.obj.address} value={index}>{subItem.obj.name}
                                                              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                                                              {subItem.obj.address}
                                                              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                                                              {subItem.obj.isOracle && "Use an oracle"} </option>})}
          </select>
        </div>
      </div>
      )
    }
  }
export default SelectBank;