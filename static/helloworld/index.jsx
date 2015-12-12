//引入React和HelloMessage模块
var React = require('react');
var HelloMessage = require('/static/common/components/HelloMessage/HelloMessage.react');

React.render(
  <HelloMessage message="I like commonjs!" />,
  document.getElementById('helloApp')
);