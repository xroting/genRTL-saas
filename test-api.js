// 测试后端 API 是否正常工作
const http = require('http');

const data = JSON.stringify({
  messages: [{
    role: "user",
    content: "Hello"
  }],
  model: "gpt-4",
  stream: false
});

const options = {
  hostname: 'localhost',
  port: 3005,
  path: '/api/chat',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  console.log(`状态码: ${res.statusCode}`);
  console.log(`响应头: ${JSON.stringify(res.headers)}`);
  
  let responseData = '';
  
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    console.log('响应体:');
    try {
      const json = JSON.parse(responseData);
      console.log(JSON.stringify(json, null, 2));
    } catch (e) {
      console.log(responseData);
    }
  });
});

req.on('error', (e) => {
  console.error(`请求遇到问题: ${e.message}`);
});

req.write(data);
req.end();

