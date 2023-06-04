const getFeed = (document) => {
  const title = document.querySelector('channel title').textContent;
  const description = document.querySelector('channel description').textContent;
  return {
    title,
    description,
  };
};

const getPosts = (document) => {
  const items = document.querySelectorAll('item');
  const list = Array.from(items);
  return list.map((item) => ({
    title: item.querySelector('title').textContent,
    description: item.querySelector('description').textContent,
    link: item.querySelector('link').textContent,
  }));
};

export default (data) => {
  const parser = new DOMParser();
  const xmlDocument = parser.parseFromString(data, 'application/xml');
  const parsererror = xmlDocument.querySelector('parsererror');
  if (parsererror) {
    const error = new Error(parsererror.textContent);
    error.isParserError = true;
    throw error;
  }
  return [getFeed(xmlDocument), getPosts(xmlDocument)];
};
