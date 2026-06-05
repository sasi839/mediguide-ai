async function test() {
  const loginRes = await fetch('http://localhost:4000/api/auth/signin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: "testfamily5@example.com", password: "password" })
  });
  const loginData = await loginRes.json();
  console.log("Token:", loginData.token);

  const groupRes = await fetch('http://localhost:4000/api/family/group/create', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${loginData.token}`
    },
    body: JSON.stringify({ name: "Fetch Group" })
  });
  console.log("Create Group Status:", groupRes.status);
  console.log("Create Group Body:", await groupRes.json());
}
test();
