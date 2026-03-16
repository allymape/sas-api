const { AsyncLocalStorage } = require("async_hooks");

const store = new AsyncLocalStorage();

const bindRequestContext = (req, res, next) => {
  store.run(
    {
      req,
      started_at: Date.now(),
    },
    next
  );
};

const getRequestContext = () => store.getStore() || null;

module.exports = {
  bindRequestContext,
  getRequestContext,
};

