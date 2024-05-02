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
    word VARCHAR(45) UNIQUE NOT NULL,
    unique_count BIGINT
);

CREATE TABLE website_keywords (
    id BIGSERIAL PRIMARY KEY,
    keyword_id UUID NOT NULL REFERENCES keywords (id),
    website_id UUID NOT NULL REFERENCES websites(id),
    count INT NOT NULL
);

CREATE INDEX idx_keywords_name ON keywords (word);
CREATE INDEX website_keyword_id ON website_keywords (keyword_id);
