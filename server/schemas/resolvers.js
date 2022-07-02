const { AuthenticationError } = require('apollo-server-express');
const { User, Book } = require('../models');
const { signToken } = require('../utils/auth');

const resolvers = {
   Query:{
      // find a single user by the login id
      me: async (parent, args, context) => {
        if (context.user) {
          return User.findOne({ _id: context.user._id }).select('-_v -password').populate('savedBooks');
        }
        throw new AuthenticationError('You are not logged in!');
      },
   } ,
   Mutation:{
    addUser: async(parent, { username, email, password }) => {
        const user = await User.create({ username, email, password })
        const token = signToken(user);
        return { user,token }
    },
    login: async(parent, { email, password }) => {
        const user = await User.findOne({email});
        if(!user){
         throw new AuthenticationError('Incorrect email or password');
        }
        const checkPwd = await user.isCorrectPassword(password);
        if(!checkPwd) {
         throw new AuthenticationError('Incorrect email or password');
        }
        const token = signToken(user);
        return { token, user }
    },
    saveBook: async(parent, { input }, context) => {
        if(context.user){
            const updatedUser = await User.findByIdAndUpdate(
             {_id: context.user._id},
             {$addToSet: { savedBooks: input }},
             {new: true}
            );
            return updatedUser
        }
        throw new AuthenticationError('You are not logged in!');
    },
    removeBook: async(parent, { bookId }, context) => {
        if(context.user){
            const updatedUser = await User.findOneAndUpdate(
                { _id: context.user._id },
                { $pull: { savedBooks: { bookId: bookId } } },
                { new: true }
            );
            return updatedUser
        }
     throw new AuthenticationError('You are not logged in!');
    }
}
}

module.exports = resolvers;