function extractLeadSource(data){
  let headers = [];    
  for(let i=0; i<data.length;i++){
      headers.push(data[i].LeadSourceGroup);
  }
  return headers;
}

module.exports = { extractLeadSource }
