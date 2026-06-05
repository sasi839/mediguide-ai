const http = require('http');

async function test() {
  // 1. Sign up user
  const signupData = JSON.stringify({ email: "testfamily5@example.com", password: "password", role: "OWNER", name: "Test" });
  const signupReq = http.request('http://localhost:4000/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': signupData.length }
  }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log("Signup:", data);
      
      // 2. Sign in user
      const signinData = JSON.stringify({ email: "testfamily5@example.com", password: "password" });
      const signinReq = http.request('http://localhost:4000/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': signinData.length }
      }, (res2) => {
        let data2 = '';
        res2.on('data', chunk => data2 += chunk);
        res2.on('end', () => {
          console.log("Signin:", data2);
          const token = JSON.parse(data2).token;

          // 3. Create family
          const createData = JSON.stringify({ name: "Testing Family" });
          const createReq = http.request('http://localhost:4000/api/family/group/create', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json', 
              'Content-Length': createData.length,
              'Authorization': `Bearer ${token}`
            }
          }, (res3) => {
            let data3 = '';
            res3.on('data', chunk => data3 += chunk);
            res3.on('end', () => {
              console.log("Create Family:", res3.statusCode, data3);
              
              // 4. Pharmacy Test
              const signinPharma = JSON.stringify({ email: "pharmacy@example.com", password: "password", role: "PHARMACY", name: "Pharma" });
              const reqP = http.request('http://localhost:4000/api/auth/signup', {
                 method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': signinPharma.length }
              }, (rp) => {
                 let dp = ''; rp.on('data', c => dp += c); rp.on('end', () => {
                    const signinPharmaReq = http.request('http://localhost:4000/api/auth/signin', {
                       method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': JSON.stringify({email:"pharmacy@example.com", password:"password"}).length }
                    }, (rp2) => {
                       let dp2 = ''; rp2.on('data', c => dp2+=c); rp2.on('end', () => {
                          const pToken = JSON.parse(dp2).token;
                          
                          // Add stock
                          const stockData = JSON.stringify({ medicineName: "Test Med", quantity: "10", price: "5.5" });
                          const reqS = http.request('http://localhost:4000/api/pharmacy/stock', {
                             method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': stockData.length, 'Authorization': `Bearer ${pToken}` }
                          }, (rs) => {
                             let ds = ''; rs.on('data', c => ds+=c); rs.on('end', () => {
                                console.log("Add Stock:", rs.statusCode, ds);
                             });
                          });
                          reqS.write(stockData); reqS.end();
                       });
                    });
                    signinPharmaReq.write(JSON.stringify({email:"pharmacy@example.com", password:"password"})); signinPharmaReq.end();
                 });
              });
              reqP.write(signinPharma); reqP.end();

            });
          });
          createReq.write(createData);
          createReq.end();
        });
      });
      signinReq.write(signinData);
      signinReq.end();
    });
  });
  signupReq.write(signupData);
  signupReq.end();
}

test();
