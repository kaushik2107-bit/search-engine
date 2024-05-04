CREATE TABLE websites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(512) NOT NULL,
    description TEXT NOT NULL,
    url VARCHAR(2048) UNIQUE NOT NULL,
    word_count INT NOT NULL,
    rank INT NOT NULL
);

CREATE TABLE keywords (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    word VARCHAR(100) UNIQUE NOT NULL,
    unique_count BIGINT
);

CREATE TABLE website_keywords (
    id BIGSERIAL PRIMARY KEY,
    keyword_id UUID NOT NULL REFERENCES keywords (id),
    website_id UUID NOT NULL REFERENCES websites(id),
    count INT NOT NULL
);

CREATE TABLE edges (
    url1 UUID NOT NULL REFERENCES websites(id),
    url2 UUID NOT NULL REFERENCES websites(id),
    primary key (url1, url2)
);

CREATE TABLE edges_to_crawl (
    url1 VARCHAR(2048) NOT NULL,
    url2 VARCHAR(2048) NOT NULL,
    is_crawled boolean default false,
    primary key (url1, url2)
);

CREATE INDEX idx_keywords_name ON keywords (word);
CREATE INDEX website_keyword_id ON website_keywords (keyword_id);
