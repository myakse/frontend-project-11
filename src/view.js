import onChange from 'on-change';

const setAttributes = (element, attributes) => {
  attributes.forEach((attr) => {
    const [name, value] = attr;
    element.setAttribute(name, value);
  });
};

const feedbackRender = (value, type, i18n, elements) => {
  switch (type) {
    case 'error':
      elements.feedback.classList.replace('text-success', 'text-danger');
      break;
    case 'loaded':
      elements.feedback.classList.replace('text-danger', 'text-success');
      break;
    default:
      break;
  }
  elements.feedback.textContent = i18n.t(`${type}.${value}`);
};

const containerRender = (containerName, container, i18n) => {
  const card = document.createElement('div');
  card.classList.add('card', 'border-0');
  card.innerHTML = '';

  const cardBody = document.createElement('div');
  cardBody.classList.add('card-body');
  const cardHeader = document.createElement('h2');
  cardHeader.classList.add('card-title', 'h4');
  cardHeader.textContent = i18n.t(`${containerName}`);
  cardBody.append(cardHeader);

  const list = document.createElement('ul');
  list.classList.add('list-group', 'border-0', 'rounded-0');

  card.append(cardBody, list);

  container.innerHTML = '';
  container.append(card);
};

const modalRender = (id, posts, elements) => {
  const a = document.querySelector(`[data-id="${id}"]`);
  a.classList.replace('fw-bold', 'fw-normal');
  a.classList.add('link-secondary');

  const selectedPost = posts.find((post) => post.id === id);

  elements.modalTitle.textContent = selectedPost.title;
  elements.modalDescription.textContent = selectedPost.description;
  elements.modalFullArticle.setAttribute('href', selectedPost.link);
};

const feedsRender = (feeds, i18n, elements) => {
  containerRender('feeds', elements.feeds, i18n);

  const feedsList = elements.feeds.querySelector('.card ul');

  feeds.forEach((feed) => {
    const li = document.createElement('li');
    li.classList.add('list-group-item', 'border-0', 'border-end-0');
    const feedHeader = document.createElement('h3');
    feedHeader.classList.add('h6', 'm-0');
    feedHeader.textContent = feed.title;
    const feedDescription = document.createElement('p');
    feedDescription.classList.add('m-0', 'small', 'text-black-50');
    feedDescription.textContent = feed.description;

    li.append(feedHeader, feedDescription);
    feedsList.prepend(li);
  });
};

const postsRender = (posts, readPostsIds, i18n, elements) => {
  containerRender('posts', elements.posts, i18n);

  const postsList = elements.posts.querySelector('.card ul');

  posts.forEach((post) => {
    const li = document.createElement('li');
    li.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start', 'border-0', 'border-end-0');

    const a = document.createElement('a');

    a.classList.add('fw-bold');
    if (readPostsIds.has(post.id)) {
      a.classList.replace('fw-bold', 'fw-normal');
      a.classList.add('link-secondary');
    }

    const aAttributes = [['href', post.link], ['data-id', post.id], ['target', '_blank'], ['rel', 'noopener norefferer']];
    setAttributes(a, aAttributes);
    a.textContent = post.title;

    const button = document.createElement('button');
    const buttonAttributes = [['type', 'button'], ['data-id', post.id], ['data-bs-toggle', 'modal'], ['data-bs-target', '#modal']];
    setAttributes(button, buttonAttributes);
    button.classList.add('btn', 'btn-outline-primary', 'btn-sm');
    button.textContent = i18n.t('watchButton');

    li.append(a, button);
    postsList.append(li);
  });
};

export default (state, i18n, elements) => {
  const watchedState = onChange(state, (path, value) => {
    switch (path) {
      case 'status':
        if (value === 'loading') {
          elements.submit.disabled = true;
        }
        if (value === 'loaded') {
          feedbackRender('success', 'loaded', i18n, elements);
          elements.submit.disabled = false;
        }
        if (value === 'failed') {
          feedbackRender(state.error, 'error', i18n, elements);
          elements.submit.disabled = false;
        }
        break;
      case 'feeds':
        feedsRender(value, i18n, elements);
        break;
      case 'posts':
        postsRender(value, state.readPostsIds, i18n, elements);
        break;
      case 'selectedPostId':
        modalRender(value, state.posts, elements);
        break;
      default:
        break;
    }
  });

  return watchedState;
};
