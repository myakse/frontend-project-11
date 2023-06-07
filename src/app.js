/* eslint-disable no-unused-vars */
import * as yup from 'yup';
import _ from 'lodash';
import axios from 'axios';
import * as i18next from 'i18next';
import resources from './locales/resources.js';
import getWatchedState from './view.js';
import parseData from './parser.js';

const addProxy = (url) => {
  const urlWithProxy = new URL('/get', 'https://allorigins.hexlet.app');
  urlWithProxy.searchParams.set('url', url);
  urlWithProxy.searchParams.set('disableCache', 'true');
  return urlWithProxy.toString();
};

const updateRSS = (watchedState) => {
  const promises = watchedState.feeds.map((feed) => axios.get(addProxy(feed.link))
    .then((response) => {
      const [, posts] = parseData(response.data.contents);
      const postsFromState = watchedState.posts.filter((post) => post.feedId === feed.id);
      const newPosts = _.differenceBy(posts, postsFromState, 'link');
      newPosts.forEach((post) => {
        post.id = _.uniqueId();
        post.feedId = feed.id;
      });
      watchedState.posts = [...newPosts, ...watchedState.posts];
    })
    .catch(() => []));
  Promise.all(promises)
    .finally(() => {
      setTimeout(updateRSS, 5000, watchedState);
    });
};

const getFeed = (url, watchedState) => {
  axios.get(addProxy(url))
    .then((response) => {
      const [feed, posts] = parseData(response.data.contents);
      feed.id = _.uniqueId();
      feed.link = url;
      const feedId = feed.id;
      watchedState.feeds.push(feed);
      posts.forEach((post) => {
        post.id = _.uniqueId();
        post.feedId = feedId;
      });
      watchedState.posts = [...posts, ...watchedState.posts];
      watchedState.status = 'loaded';
    })
    .catch((err) => {
      if (err.isAxiosError) {
        watchedState.error = 'networkError';
      } else if (err.isParserError) {
        watchedState.error = 'parserError';
      } else {
        watchedState.error = 'unknowError';
      }
      watchedState.status = 'failed';
    });
};

export default () => {
  const i18n = i18next.createInstance();
  i18n.init({
    lng: 'ru',
    resources,
  })
    .then(() => {
      const initialState = {
        status: 'filling',
        error: null,
        feeds: [],
        posts: [],
        selectedPostId: null,
        readPostsIds: new Set(),
      };

      const elements = {
        form: document.querySelector('form'),
        posts: document.querySelector('.posts'),
        feeds: document.querySelector('.feeds'),
        submit: document.querySelector('.rss-form .btn'),
        feedback: document.querySelector('.feedback'),
        modal: document.querySelector('.modal'),
        modalTitle: document.querySelector('.modal-title'),
        modalDescription: document.querySelector('.modal-body'),
        modalFullArticle: document.querySelector('.full-article'),
      };

      const watchedState = getWatchedState(initialState, i18n, elements);

      yup.setLocale({
        string: {
          url: ({ url }) => ({ key: 'notValidURL', values: { url } }),
        },
        mixed: {
          notOneOf: ({ notOneOf }) => ({ key: 'oneOfFeeds', values: { notOneOf } }),
        },
      });

      const validate = (url, urls) => {
        const validateSchema = yup.string()
          .trim()
          .url()
          .notOneOf(urls)
          .required();
        return validateSchema.validate(url);
      };

      elements.form.addEventListener('submit', (e) => {
        e.preventDefault();
        const url = new FormData(elements.form).get('url');
        const feedsURLs = watchedState.feeds.map(({ link }) => link);
        watchedState.status = 'loading';
        validate(url, feedsURLs)
          .then(() => {
            getFeed(url, watchedState);
          })
          .catch((err) => {
            const [error] = err.errors;
            const { key } = error;
            watchedState.error = key;
            watchedState.status = 'failed';
          });
        elements.form.reset();
      });

      elements.posts.addEventListener('click', (e) => {
        const { target } = e;
        const { dataset: { id } } = target;
        if (id) {
          watchedState.readPostsIds.add(id);
          watchedState.selectedPostId = id;
        }
      });

      updateRSS(watchedState);
    });
};
