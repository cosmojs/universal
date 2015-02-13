module.exports = function(BaseUser) {

  // BaseUser.settings.acls.push({ 
  //     "principalType": "ROLE", 
  //     "principalId": "$owner", 
  //     "permission": "ALLOW", 
  //     "property": "upsert" 
  // });

  // unlink
  BaseUser.unlink = function(id, provider, callback) {
    BaseUser.findById(id, function(err, user) {
      if (!user) {
        res.status(400).send({ message: 'User not found' });
        return;
      }
      user[provider] = undefined;
      user.save(function () {
        callback(null, true);      
      });
    });
  };
  BaseUser.remoteMethod('unlink', {
    accepts: [
      {arg: 'id', type: 'string', required: true},
      {arg: 'provider', type: 'string', required: true},
    ],
    returns: {arg: 'success', type: 'boolean'},
    http: {path:'/:id/unlink/:provider', verb: 'get'}
  });

};
