import logging
import re
import string
from collections import Counter
from typing import List, Dict, Any, Tuple, Optional, Set, Union

import nltk
import numpy as np
import spacy
from nltk.corpus import stopwords
from nltk.stem import PorterStemmer
from nltk.tokenize import word_tokenize, sent_tokenize
from sklearn.feature_extraction.text import TfidfVectorizer, CountVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from ..config.settings import NLP_CONFIG
from .data_preprocessing import clean_text_data

# Configure logging
logger = logging.getLogger(__name__)

# Initialize spaCy model
# Load medium-sized English model with word vectors
try:
    nlp = spacy.load('en_core_web_md')
except OSError:
    logger.warning("Spacy model 'en_core_web_md' not found. Downloading...")
    spacy.cli.download('en_core_web_md')
    nlp = spacy.load('en_core_web_md')

# Load NLTK resources
try:
    STOPWORDS = set(nltk.corpus.stopwords.words('english'))
except LookupError:
    logger.warning("NLTK stopwords not found. Downloading...")
    nltk.download('stopwords')
    STOPWORDS = set(nltk.corpus.stopwords.words('english'))

try:
    nltk.word_tokenize("Test")
except LookupError:
    logger.warning("NLTK punkt not found. Downloading...")
    nltk.download('punkt')

# Communication style markers for analysis
COMMUNICATION_STYLE_MARKERS = {
    'direct': ['exactly', 'precisely', 'specifically', 'clearly', 'directly'],
    'indirect': ['perhaps', 'maybe', 'possibly', 'kind of', 'sort of'],
    'analytical': ['analyze', 'consider', 'examine', 'evaluate', 'assess'],
    'intuitive': ['feel', 'sense', 'imagine', 'believe', 'think'],
    'expressive': ['excited', 'love', 'hate', 'amazing', 'terrible'],
    'reserved': ['fine', 'okay', 'acceptable', 'reasonable', 'adequate']
}


def tokenize_text(text: str, level: str = 'word') -> List[str]:
    """
    Tokenize text into words or sentences.
    
    Args:
        text: The text to tokenize
        level: The tokenization level ('word' or 'sentence')
        
    Returns:
        List of tokens (words or sentences)
    """
    # Clean the input text
    cleaned_text = clean_text_data(text)
    
    if not cleaned_text:
        return []
    
    # Tokenize based on specified level
    if level == 'word':
        return word_tokenize(cleaned_text)
    elif level == 'sentence':
        return sent_tokenize(cleaned_text)
    else:
        logger.warning(f"Unknown tokenization level: {level}. Using 'word' level.")
        return word_tokenize(cleaned_text)


def remove_stopwords(tokens: List[str], custom_stopwords: Set[str] = None) -> List[str]:
    """
    Remove common stopwords from tokenized text.
    
    Args:
        tokens: List of tokens to filter
        custom_stopwords: Additional stopwords to remove
        
    Returns:
        Filtered tokens with stopwords removed
    """
    if not tokens:
        return []
    
    # Combine default stopwords with custom stopwords
    all_stopwords = STOPWORDS.copy()
    if custom_stopwords:
        all_stopwords.update(custom_stopwords)
    
    # Filter out stopwords
    return [token for token in tokens if token.lower() not in all_stopwords]


def lemmatize_tokens(tokens: List[str]) -> List[str]:
    """
    Reduce tokens to their base or dictionary form.
    
    Args:
        tokens: List of tokens to lemmatize
        
    Returns:
        Lemmatized tokens
    """
    if not tokens:
        return []
    
    # Join tokens to create a document
    text = ' '.join(tokens)
    
    # Process with spaCy
    doc = nlp(text)
    
    # Extract lemmas
    return [token.lemma_ for token in doc]


def stem_tokens(tokens: List[str]) -> List[str]:
    """
    Reduce tokens to their stems using Porter stemmer.
    
    Args:
        tokens: List of tokens to stem
        
    Returns:
        Stemmed tokens
    """
    if not tokens:
        return []
    
    # Initialize stemmer
    stemmer = PorterStemmer()
    
    # Apply stemming
    return [stemmer.stem(token) for token in tokens]


def extract_entities(text: str, entity_types: List[str] = None) -> Dict[str, List[str]]:
    """
    Extract named entities from text using spaCy.
    
    Args:
        text: Text to analyze
        entity_types: List of entity types to extract (e.g., 'PERSON', 'ORG', 'GPE')
                     If None, extracts all entity types
        
    Returns:
        Dictionary of entity types and their occurrences
    """
    # Clean the input text
    cleaned_text = clean_text_data(text)
    
    if not cleaned_text:
        return {}
    
    # Process with spaCy
    doc = nlp(cleaned_text)
    
    # Extract entities
    entities = {}
    
    for ent in doc.ents:
        # Filter by entity type if specified
        if entity_types and ent.label_ not in entity_types:
            continue
        
        if ent.label_ not in entities:
            entities[ent.label_] = []
        
        entities[ent.label_].append(ent.text)
    
    return entities


def extract_keywords(text: str, top_n: int = 10) -> List[Tuple[str, float]]:
    """
    Extract important keywords from text using TF-IDF.
    
    Args:
        text: Text to analyze
        top_n: Number of top keywords to return
        
    Returns:
        List of top keywords with scores
    """
    # Clean the input text
    cleaned_text = clean_text_data(text)
    
    if not cleaned_text:
        return []
    
    # Tokenize
    tokens = tokenize_text(cleaned_text, 'word')
    
    # Remove stopwords
    filtered_tokens = remove_stopwords(tokens)
    
    if not filtered_tokens:
        return []
    
    # Create a document for TF-IDF
    document = [' '.join(filtered_tokens)]
    
    # Calculate TF-IDF
    try:
        vectorizer = TfidfVectorizer()
        tfidf_matrix = vectorizer.fit_transform(document)
        
        # Get feature names (terms)
        feature_names = vectorizer.get_feature_names_out()
        
        # Extract scores for the first document
        scores = tfidf_matrix.toarray()[0]
        
        # Sort terms by score
        sorted_items = sorted(zip(feature_names, scores), key=lambda x: x[1], reverse=True)
        
        # Return top N keywords
        return sorted_items[:top_n]
    except Exception as e:
        logger.error(f"Error extracting keywords: {e}")
        return []


def calculate_text_similarity(text1: str, text2: str, method: str = 'cosine') -> float:
    """
    Calculate semantic similarity between two texts.
    
    Args:
        text1: First text
        text2: Second text
        method: Similarity method ('cosine', 'spacy', 'jaccard')
        
    Returns:
        Similarity score between 0 and 1
    """
    # Clean the input texts
    cleaned_text1 = clean_text_data(text1)
    cleaned_text2 = clean_text_data(text2)
    
    if not cleaned_text1 or not cleaned_text2:
        return 0.0
    
    if method == 'cosine':
        # TF-IDF Vectorization with Cosine Similarity
        vectorizer = TfidfVectorizer()
        try:
            tfidf_matrix = vectorizer.fit_transform([cleaned_text1, cleaned_text2])
            similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
            return float(similarity)
        except Exception as e:
            logger.error(f"Error calculating cosine similarity: {e}")
            return 0.0
    
    elif method == 'spacy':
        # Use spaCy's vector similarity
        doc1 = nlp(cleaned_text1)
        doc2 = nlp(cleaned_text2)
        
        # Check if documents have vectors
        if doc1.vector_norm and doc2.vector_norm:
            similarity = doc1.similarity(doc2)
            return float(similarity)
        else:
            logger.warning("One or both documents have no vector representation")
            return 0.0
    
    elif method == 'jaccard':
        # Jaccard similarity
        tokens1 = set(tokenize_text(cleaned_text1))
        tokens2 = set(tokenize_text(cleaned_text2))
        
        if not tokens1 or not tokens2:
            return 0.0
        
        intersection = tokens1.intersection(tokens2)
        union = tokens1.union(tokens2)
        
        similarity = len(intersection) / len(union) if union else 0.0
        return similarity
    
    else:
        logger.warning(f"Unknown similarity method: {method}. Using 'cosine' method.")
        return calculate_text_similarity(text1, text2, 'cosine')


def analyze_sentiment(text: str) -> Dict[str, Any]:
    """
    Analyze sentiment of text to determine positivity/negativity.
    
    Args:
        text: Text to analyze
        
    Returns:
        Sentiment analysis with polarity and subjectivity scores
    """
    # Clean the input text
    cleaned_text = clean_text_data(text)
    
    if not cleaned_text:
        return {'polarity': 0.0, 'subjectivity': 0.0, 'sentiment': 'neutral'}
    
    # Process with spaCy
    doc = nlp(cleaned_text)
    
    # Initialize sentiment values
    polarity = 0.0
    subjectivity = 0.0
    
    # Simple lexicon-based approach
    positive_words = 0
    negative_words = 0
    subjective_words = 0
    total_words = len(doc)
    
    # Analyze each token
    for token in doc:
        # Check for sentiment-bearing words using token attributes
        if not token.is_stop and not token.is_punct and token.has_vector:
            # Use spaCy's similarity to known positive/negative words
            if token.similarity(nlp("good")) > 0.6 or token.similarity(nlp("excellent")) > 0.6:
                positive_words += 1
                subjective_words += 1
            elif token.similarity(nlp("bad")) > 0.6 or token.similarity(nlp("terrible")) > 0.6:
                negative_words += 1
                subjective_words += 1
    
    # Calculate polarity (-1 to 1)
    if total_words > 0:
        polarity = (positive_words - negative_words) / total_words
        subjectivity = subjective_words / total_words
    
    # Determine sentiment category
    sentiment = 'neutral'
    if polarity > 0.1:
        sentiment = 'positive'
    elif polarity < -0.1:
        sentiment = 'negative'
    
    return {
        'polarity': polarity,
        'subjectivity': subjectivity,
        'sentiment': sentiment,
        'positive_words': positive_words,
        'negative_words': negative_words,
        'total_words': total_words
    }


def extract_topics(text: str, num_topics: int = 3) -> List[Dict[str, Any]]:
    """
    Extract main topics from text using NLP techniques.
    
    Args:
        text: Text to analyze
        num_topics: Number of topics to extract
        
    Returns:
        List of extracted topics with relevance scores
    """
    # Clean the input text
    cleaned_text = clean_text_data(text)
    
    if not cleaned_text or len(cleaned_text.split()) < 10:
        return []
    
    # Tokenize and preprocess
    tokens = tokenize_text(cleaned_text, 'word')
    tokens = remove_stopwords(tokens)
    tokens = lemmatize_tokens(tokens)
    
    if not tokens:
        return []
    
    # Create document
    document = ' '.join(tokens)
    
    # Simple approach: use term frequency to identify topics
    try:
        # Count term frequency
        vectorizer = CountVectorizer(ngram_range=(1, 2), max_features=100)
        X = vectorizer.fit_transform([document])
        
        # Get feature names and term frequencies
        feature_names = vectorizer.get_feature_names_out()
        term_freq = X.toarray()[0]
        
        # Sort terms by frequency
        sorted_items = sorted(zip(feature_names, term_freq), key=lambda x: x[1], reverse=True)
        
        # Build topics as clusters of related terms
        topics = []
        used_terms = set()
        
        for term, freq in sorted_items:
            if len(topics) >= num_topics:
                break
            
            if term in used_terms:
                continue
                
            # Create a topic
            related_terms = []
            for other_term, other_freq in sorted_items:
                if other_term != term and other_term not in used_terms:
                    # Check if terms are related (using spaCy similarity)
                    similarity = nlp(term).similarity(nlp(other_term))
                    if similarity > 0.5:
                        related_terms.append((other_term, other_freq))
                        used_terms.add(other_term)
                        
                        if len(related_terms) >= 4:  # Limit related terms
                            break
            
            # Add the main term
            used_terms.add(term)
            
            # Create topic with keywords and score
            topic = {
                'main_keyword': term,
                'keywords': [term] + [t[0] for t in related_terms],
                'relevance_score': float(freq / term_freq.sum()),
                'frequency': int(freq)
            }
            
            topics.append(topic)
        
        return topics
        
    except Exception as e:
        logger.error(f"Error extracting topics: {e}")
        return []


def summarize_text(text: str, ratio: float = 0.3) -> str:
    """
    Generate a concise summary of longer text.
    
    Args:
        text: Text to summarize
        ratio: Proportion of original text to include in summary
        
    Returns:
        Summarized text
    """
    # Clean the input text
    cleaned_text = clean_text_data(text)
    
    if not cleaned_text:
        return ""
    
    # Tokenize into sentences
    sentences = tokenize_text(cleaned_text, 'sentence')
    
    if not sentences or len(sentences) <= 3:
        return cleaned_text  # Text is already short
    
    # Calculate sentence scores based on keyword frequency
    word_frequencies = {}
    
    # Process all words
    for sentence in sentences:
        for word in tokenize_text(sentence, 'word'):
            word = word.lower()
            if word not in STOPWORDS:
                if word not in word_frequencies:
                    word_frequencies[word] = 1
                else:
                    word_frequencies[word] += 1
    
    # Normalize frequencies
    max_frequency = max(word_frequencies.values()) if word_frequencies else 1
    for word in word_frequencies:
        word_frequencies[word] = word_frequencies[word] / max_frequency
    
    # Score sentences based on word frequency
    sentence_scores = {}
    for i, sentence in enumerate(sentences):
        for word in tokenize_text(sentence, 'word'):
            if word.lower() in word_frequencies:
                if i not in sentence_scores:
                    sentence_scores[i] = word_frequencies[word.lower()]
                else:
                    sentence_scores[i] += word_frequencies[word.lower()]
    
    # Get top sentences
    num_sentences = max(1, int(len(sentences) * ratio))
    top_indices = sorted(sentence_scores, key=sentence_scores.get, reverse=True)[:num_sentences]
    
    # Sort indices to maintain original order
    top_indices = sorted(top_indices)
    
    # Rebuild summary from selected sentences
    summary_sentences = [sentences[i] for i in top_indices]
    summary = ' '.join(summary_sentences)
    
    return summary


def extract_communication_style(text: str) -> Dict[str, Any]:
    """
    Analyze text to determine the author's communication style.
    
    Args:
        text: Text to analyze
        
    Returns:
        Communication style analysis with dimension scores
    """
    # Clean the input text
    cleaned_text = clean_text_data(text)
    
    if not cleaned_text:
        return {
            'directness': 0.5,
            'analytical_vs_intuitive': 0.5,
            'expressiveness': 0.5,
            'sentence_complexity': 0.5,
            'dominant_style': 'balanced'
        }
    
    # Tokenize text
    sentences = tokenize_text(cleaned_text, 'sentence')
    words = tokenize_text(cleaned_text, 'word')
    
    # Process with spaCy for deeper analysis
    doc = nlp(cleaned_text)
    
    # 1. Analyze directness (direct vs. indirect communication)
    direct_markers = sum(1 for word in words if word.lower() in COMMUNICATION_STYLE_MARKERS['direct'])
    indirect_markers = sum(1 for word in words if word.lower() in COMMUNICATION_STYLE_MARKERS['indirect'])
    
    # Calculate directness score (0 = indirect, 1 = direct)
    directness = 0.5  # Default balanced
    if direct_markers + indirect_markers > 0:
        directness = direct_markers / (direct_markers + indirect_markers)
    
    # 2. Analyze analytical vs. intuitive processing
    analytical_markers = sum(1 for word in words if word.lower() in COMMUNICATION_STYLE_MARKERS['analytical'])
    intuitive_markers = sum(1 for word in words if word.lower() in COMMUNICATION_STYLE_MARKERS['intuitive'])
    
    # Calculate analytical score (0 = intuitive, 1 = analytical)
    analytical_vs_intuitive = 0.5  # Default balanced
    if analytical_markers + intuitive_markers > 0:
        analytical_vs_intuitive = analytical_markers / (analytical_markers + intuitive_markers)
    
    # 3. Analyze expressiveness
    expressive_markers = sum(1 for word in words if word.lower() in COMMUNICATION_STYLE_MARKERS['expressive'])
    reserved_markers = sum(1 for word in words if word.lower() in COMMUNICATION_STYLE_MARKERS['reserved'])
    
    # Calculate expressiveness score (0 = reserved, 1 = expressive)
    expressiveness = 0.5  # Default balanced
    if expressive_markers + reserved_markers > 0:
        expressiveness = expressive_markers / (expressive_markers + reserved_markers)
    
    # 4. Analyze sentence structure and complexity
    avg_sentence_length = len(words) / len(sentences) if sentences else 0
    max_sentence_length = 30  # Threshold for complexity
    
    # Calculate sentence complexity score (0 = simple, 1 = complex)
    sentence_complexity = min(1.0, avg_sentence_length / max_sentence_length)
    
    # Determine dominant style
    style_scores = {
        'direct': directness,
        'analytical': analytical_vs_intuitive,
        'intuitive': 1 - analytical_vs_intuitive,
        'expressive': expressiveness,
        'reserved': 1 - expressiveness,
    }
    
    dominant_style = max(style_scores, key=style_scores.get)
    if max(style_scores.values()) < 0.6:
        dominant_style = 'balanced'
    
    return {
        'directness': directness,
        'analytical_vs_intuitive': analytical_vs_intuitive,
        'expressiveness': expressiveness,
        'sentence_complexity': sentence_complexity,
        'dominant_style': dominant_style,
        'avg_sentence_length': avg_sentence_length
    }


def batch_process_texts(texts: List[str], operation: str, operation_params: Dict[str, Any] = None) -> List[Any]:
    """
    Process multiple texts with the same NLP operation.
    
    Args:
        texts: List of texts to process
        operation: The operation to perform ('tokenize', 'extract_keywords', etc.)
        operation_params: Parameters for the operation
        
    Returns:
        List of operation results for each text
    """
    if not texts:
        return []
    
    operation_params = operation_params or {}
    results = []
    
    # Map operation names to functions
    operation_map = {
        'tokenize': tokenize_text,
        'remove_stopwords': remove_stopwords,
        'lemmatize': lemmatize_tokens,
        'stem': stem_tokens,
        'extract_entities': extract_entities,
        'extract_keywords': extract_keywords,
        'analyze_sentiment': analyze_sentiment,
        'extract_topics': extract_topics,
        'summarize': summarize_text,
        'communication_style': extract_communication_style,
        'similarity': calculate_text_similarity
    }
    
    if operation not in operation_map:
        logger.error(f"Unknown operation: {operation}")
        return []
    
    # Handle special case for similarity (which compares pairs of texts)
    if operation == 'similarity' and len(texts) >= 2 and 'reference_text' not in operation_params:
        # Compare each text to the first text
        reference_text = texts[0]
        return [
            calculate_text_similarity(reference_text, text, 
                                     method=operation_params.get('method', 'cosine'))
            for text in texts[1:]
        ]
    
    # Process each text with the selected operation
    for text in texts:
        try:
            func = operation_map[operation]
            if operation == 'tokenize':
                result = func(text, operation_params.get('level', 'word'))
            elif operation == 'remove_stopwords':
                tokens = tokenize_text(text, 'word')
                result = func(tokens, operation_params.get('custom_stopwords'))
            elif operation == 'lemmatize' or operation == 'stem':
                tokens = tokenize_text(text, 'word')
                result = func(tokens)
            elif operation == 'extract_entities':
                result = func(text, operation_params.get('entity_types'))
            elif operation == 'extract_keywords':
                result = func(text, operation_params.get('top_n', 10))
            elif operation == 'extract_topics':
                result = func(text, operation_params.get('num_topics', 3))
            elif operation == 'summarize':
                result = func(text, operation_params.get('ratio', 0.3))
            elif operation == 'similarity' and 'reference_text' in operation_params:
                result = func(operation_params['reference_text'], text, 
                             operation_params.get('method', 'cosine'))
            else:
                result = func(text)
            
            results.append(result)
        except Exception as e:
            logger.error(f"Error processing text with operation {operation}: {e}")
            # Add a default value based on the operation
            if operation == 'tokenize' or operation == 'remove_stopwords' or operation == 'lemmatize' or operation == 'stem':
                results.append([])
            elif operation == 'extract_entities' or operation == 'analyze_sentiment' or operation == 'communication_style':
                results.append({})
            elif operation == 'extract_keywords' or operation == 'extract_topics':
                results.append([])
            elif operation == 'summarize':
                results.append("")
            elif operation == 'similarity':
                results.append(0.0)
    
    return results


class TextAnalyzer:
    """Class for comprehensive text analysis with multiple NLP techniques."""
    
    def __init__(self, config: Dict[str, Any] = None):
        """
        Initialize the TextAnalyzer with configuration.
        
        Args:
            config: Configuration dictionary for analysis parameters
        """
        self._config = config or NLP_CONFIG
        self._nlp = nlp
        self._stopwords = STOPWORDS
        
        logger.debug("TextAnalyzer initialized")
    
    def analyze(self, text: str, analysis_types: List[str] = None) -> Dict[str, Any]:
        """
        Perform comprehensive analysis of text.
        
        Args:
            text: Text to analyze
            analysis_types: List of analysis types to perform
                           (entities, keywords, sentiment, topics, communication_style)
        
        Returns:
            Comprehensive analysis results
        """
        # Default to all analysis types if none specified
        if analysis_types is None:
            analysis_types = ['entities', 'keywords', 'sentiment', 'topics', 'communication_style']
        
        # Clean and preprocess text
        preprocessed = self.preprocess(text)
        
        if not preprocessed['clean_text']:
            return {'error': 'Empty or invalid text'}
        
        # Initialize results dictionary with basic information
        results = {
            'text_length': len(preprocessed['clean_text']),
            'word_count': len(preprocessed['tokens']),
            'sentence_count': len(preprocessed['sentences'])
        }
        
        # Add requested analysis results
        if 'entities' in analysis_types:
            results['entities'] = self.extract_entities(text)
        
        if 'keywords' in analysis_types:
            results['keywords'] = self.extract_keywords(text)
        
        if 'sentiment' in analysis_types:
            results['sentiment'] = self.analyze_sentiment(text)
        
        if 'topics' in analysis_types:
            results['topics'] = self.extract_topics(text)
        
        if 'communication_style' in analysis_types:
            results['communication_style'] = self.extract_communication_style(text)
        
        return results
    
    def preprocess(self, text: str, remove_stopwords: bool = False, lemmatize: bool = False) -> Dict[str, Any]:
        """
        Preprocess text for analysis.
        
        Args:
            text: Text to preprocess
            remove_stopwords: Whether to remove stopwords
            lemmatize: Whether to lemmatize tokens
        
        Returns:
            Preprocessed text in various formats
        """
        # Clean text
        clean_text = clean_text_data(text)
        
        if not clean_text:
            return {
                'raw_text': text,
                'clean_text': '',
                'tokens': [],
                'sentences': [],
                'doc': None
            }
        
        # Tokenize
        tokens = tokenize_text(clean_text, 'word')
        sentences = tokenize_text(clean_text, 'sentence')
        
        # Remove stopwords if requested
        if remove_stopwords:
            tokens = [token for token in tokens if token.lower() not in self._stopwords]
        
        # Lemmatize if requested
        if lemmatize:
            tokens = lemmatize_tokens(tokens)
        
        # Process with spaCy
        doc = self._nlp(clean_text)
        
        return {
            'raw_text': text,
            'clean_text': clean_text,
            'tokens': tokens,
            'sentences': sentences,
            'doc': doc
        }
    
    def extract_entities(self, text: str, entity_types: List[str] = None) -> Dict[str, List[str]]:
        """
        Extract named entities from text.
        
        Args:
            text: Text to analyze
            entity_types: List of entity types to extract
        
        Returns:
            Extracted entities by type
        """
        return extract_entities(text, entity_types)
    
    def extract_keywords(self, text: str, top_n: int = 10) -> List[Tuple[str, float]]:
        """
        Extract important keywords from text.
        
        Args:
            text: Text to analyze
            top_n: Number of top keywords to return
        
        Returns:
            Top keywords with scores
        """
        return extract_keywords(text, top_n)
    
    def analyze_sentiment(self, text: str) -> Dict[str, Any]:
        """
        Analyze sentiment of text.
        
        Args:
            text: Text to analyze
        
        Returns:
            Sentiment analysis results
        """
        return analyze_sentiment(text)
    
    def extract_topics(self, text: str, num_topics: int = 3) -> List[Dict[str, Any]]:
        """
        Extract main topics from text.
        
        Args:
            text: Text to analyze
            num_topics: Number of topics to extract
        
        Returns:
            Extracted topics with keywords
        """
        return extract_topics(text, num_topics)
    
    def extract_communication_style(self, text: str) -> Dict[str, Any]:
        """
        Analyze communication style from text.
        
        Args:
            text: Text to analyze
        
        Returns:
            Communication style analysis
        """
        return extract_communication_style(text)
    
    def compare_texts(self, text1: str, text2: str, method: str = 'cosine') -> Dict[str, float]:
        """
        Compare two texts for similarity.
        
        Args:
            text1: First text
            text2: Second text
            method: Similarity method
        
        Returns:
            Similarity analysis with multiple metrics
        """
        # Calculate similarity with the specified method
        primary_similarity = calculate_text_similarity(text1, text2, method)
        
        # Calculate additional similarity metrics for comparison
        results = {
            f'{method}_similarity': primary_similarity
        }
        
        # Add alternative similarity metrics if the primary method isn't one of these
        if method != 'cosine':
            results['cosine_similarity'] = calculate_text_similarity(text1, text2, 'cosine')
        
        if method != 'spacy':
            results['spacy_similarity'] = calculate_text_similarity(text1, text2, 'spacy')
        
        if method != 'jaccard':
            results['jaccard_similarity'] = calculate_text_similarity(text1, text2, 'jaccard')
        
        return results
    
    def batch_analyze(self, texts: List[str], analysis_types: List[str] = None) -> List[Dict[str, Any]]:
        """
        Analyze multiple texts in batch.
        
        Args:
            texts: List of texts to analyze
            analysis_types: List of analysis types to perform
        
        Returns:
            List of analysis results for each text
        """
        results = []
        
        for text in texts:
            try:
                analysis = self.analyze(text, analysis_types)
                results.append(analysis)
            except Exception as e:
                logger.error(f"Error in batch analysis: {e}")
                results.append({'error': str(e)})
        
        return results


class TextVectorizer:
    """Class for converting text to vector representations for similarity and clustering."""
    
    def __init__(self, config: Dict[str, Any] = None):
        """
        Initialize the TextVectorizer with configuration.
        
        Args:
            config: Configuration dictionary for vectorization parameters
        """
        self._config = config or NLP_CONFIG
        self._vectorizer = None
        self._model = None
        
        # Initialize vectorizer based on config
        vectorizer_type = self._config.get('vectorizer_type', 'tfidf')
        
        if vectorizer_type == 'tfidf':
            self._vectorizer = TfidfVectorizer(
                max_features=self._config.get('max_features', 10000),
                ngram_range=self._config.get('ngram_range', (1, 1)),
                stop_words=self._config.get('stop_words', 'english')
            )
        elif vectorizer_type == 'count':
            self._vectorizer = CountVectorizer(
                max_features=self._config.get('max_features', 10000),
                ngram_range=self._config.get('ngram_range', (1, 1)),
                stop_words=self._config.get('stop_words', 'english')
            )
        else:
            logger.warning(f"Unknown vectorizer type: {vectorizer_type}. Using TF-IDF.")
            self._vectorizer = TfidfVectorizer(
                max_features=self._config.get('max_features', 10000),
                ngram_range=self._config.get('ngram_range', (1, 1)),
                stop_words=self._config.get('stop_words', 'english')
            )
        
        logger.debug(f"TextVectorizer initialized with {vectorizer_type} vectorizer")
    
    def fit(self, texts: List[str]) -> None:
        """
        Fit the vectorizer on a corpus of texts.
        
        Args:
            texts: List of texts to fit on
        """
        if not texts:
            logger.warning("Empty corpus provided for fitting")
            return
        
        # Preprocess texts
        preprocessed_texts = [clean_text_data(text) for text in texts]
        preprocessed_texts = [text for text in preprocessed_texts if text]
        
        if not preprocessed_texts:
            logger.warning("No valid texts after preprocessing")
            return
        
        # Fit vectorizer
        try:
            self._vectorizer.fit(preprocessed_texts)
            logger.debug(f"Vectorizer fitted on {len(preprocessed_texts)} texts")
        except Exception as e:
            logger.error(f"Error fitting vectorizer: {e}")
    
    def transform(self, text: str) -> np.ndarray:
        """
        Transform text to vector representation.
        
        Args:
            text: Text to transform
        
        Returns:
            Vector representation of text
        """
        if not self._vectorizer:
            raise ValueError("Vectorizer not fitted. Call fit() first.")
        
        # Preprocess text
        preprocessed_text = clean_text_data(text)
        
        if not preprocessed_text:
            logger.warning("Empty text after preprocessing")
            return np.zeros((1, 1))
        
        # Transform text
        try:
            vector = self._vectorizer.transform([preprocessed_text])
            return vector
        except Exception as e:
            logger.error(f"Error transforming text: {e}")
            return np.zeros((1, 1))
    
    def fit_transform(self, corpus: List[str], text: str) -> np.ndarray:
        """
        Fit vectorizer on corpus and transform a text.
        
        Args:
            corpus: List of texts to fit on
            text: Text to transform
        
        Returns:
            Vector representation of text
        """
        self.fit(corpus)
        return self.transform(text)
    
    def batch_transform(self, texts: List[str]) -> np.ndarray:
        """
        Transform multiple texts to vector representations.
        
        Args:
            texts: List of texts to transform
        
        Returns:
            Matrix of vector representations
        """
        if not self._vectorizer:
            raise ValueError("Vectorizer not fitted. Call fit() first.")
        
        if not texts:
            return np.zeros((0, 0))
        
        # Preprocess texts
        preprocessed_texts = [clean_text_data(text) for text in texts]
        preprocessed_texts = [text if text else "" for text in preprocessed_texts]
        
        # Transform texts
        try:
            vectors = self._vectorizer.transform(preprocessed_texts)
            return vectors
        except Exception as e:
            logger.error(f"Error batch transforming texts: {e}")
            return np.zeros((len(texts), 1))
    
    def calculate_similarity(self, text1: str, text2: str, method: str = 'cosine') -> float:
        """
        Calculate similarity between two texts.
        
        Args:
            text1: First text
            text2: Second text
            method: Similarity method
        
        Returns:
            Similarity score
        """
        # Ensure vectorizer is fitted
        if not self._vectorizer:
            corpus = [text1, text2]
            self.fit(corpus)
        
        # Transform texts
        vector1 = self.transform(text1)
        vector2 = self.transform(text2)
        
        # Calculate similarity
        if method == 'cosine':
            try:
                similarity = cosine_similarity(vector1, vector2)[0][0]
                return float(similarity)
            except Exception as e:
                logger.error(f"Error calculating cosine similarity: {e}")
                return 0.0
        elif method == 'euclidean':
            try:
                distance = np.linalg.norm(vector1.toarray() - vector2.toarray())
                # Convert distance to similarity score (0-1)
                similarity = 1 / (1 + distance)
                return float(similarity)
            except Exception as e:
                logger.error(f"Error calculating euclidean similarity: {e}")
                return 0.0
        else:
            logger.warning(f"Unknown similarity method: {method}. Using cosine.")
            return self.calculate_similarity(text1, text2, 'cosine')
    
    def calculate_similarity_matrix(self, texts: List[str], method: str = 'cosine') -> np.ndarray:
        """
        Calculate similarity matrix for a list of texts.
        
        Args:
            texts: List of texts to compare
            method: Similarity method
        
        Returns:
            Similarity matrix
        """
        if not texts:
            return np.zeros((0, 0))
        
        # Ensure vectorizer is fitted
        if not self._vectorizer:
            self.fit(texts)
        
        # Transform all texts
        vectors = self.batch_transform(texts)
        
        # Calculate similarity matrix
        if method == 'cosine':
            try:
                similarity_matrix = cosine_similarity(vectors)
                return similarity_matrix
            except Exception as e:
                logger.error(f"Error calculating similarity matrix: {e}")
                return np.zeros((len(texts), len(texts)))
        else:
            logger.warning(f"Unknown similarity method: {method}. Using cosine.")
            return self.calculate_similarity_matrix(texts, 'cosine')


class SentimentAnalyzer:
    """Specialized class for sentiment analysis of text."""
    
    def __init__(self, config: Dict[str, Any] = None):
        """
        Initialize the SentimentAnalyzer with configuration.
        
        Args:
            config: Configuration dictionary for sentiment analysis parameters
        """
        self._config = config or NLP_CONFIG
        self._nlp = nlp
        
        # Initialize sentiment lexicon
        self._sentiment_lexicon = {
            'positive': [
                'good', 'great', 'excellent', 'wonderful', 'amazing', 'fantastic',
                'happy', 'joy', 'love', 'like', 'enjoy', 'pleased', 'satisfied'
            ],
            'negative': [
                'bad', 'terrible', 'awful', 'horrible', 'poor', 'disappointing',
                'sad', 'angry', 'hate', 'dislike', 'unhappy', 'disappointed'
            ],
            'emotions': {
                'joy': ['happy', 'joyful', 'excited', 'delighted', 'glad'],
                'sadness': ['sad', 'unhappy', 'depressed', 'gloomy', 'disappointed'],
                'anger': ['angry', 'furious', 'outraged', 'annoyed', 'irritated'],
                'fear': ['afraid', 'scared', 'frightened', 'terrified', 'anxious'],
                'surprise': ['surprised', 'amazed', 'astonished', 'shocked'],
                'disgust': ['disgusted', 'repulsed', 'revolted', 'appalled']
            }
        }
        
        logger.debug("SentimentAnalyzer initialized")
    
    def analyze(self, text: str) -> Dict[str, Any]:
        """
        Analyze sentiment of text.
        
        Args:
            text: Text to analyze
        
        Returns:
            Detailed sentiment analysis
        """
        # Clean and preprocess text
        clean_text = clean_text_data(text)
        
        if not clean_text:
            return {
                'polarity': 0.0,
                'subjectivity': 0.0,
                'sentiment': 'neutral',
                'emotions': {},
                'positive_phrases': [],
                'negative_phrases': []
            }
        
        # Process with spaCy for syntactic analysis
        doc = self._nlp(clean_text)
        
        # Initialize counters and containers
        positive_words = 0
        negative_words = 0
        positive_phrases = []
        negative_phrases = []
        emotion_scores = {emotion: 0 for emotion in self._sentiment_lexicon['emotions']}
        
        # Analyze document for sentiment
        for sentence in doc.sents:
            sentence_text = sentence.text.strip()
            sentence_sentiment = self._analyze_sentence_sentiment(sentence)
            
            # Track positive/negative phrases
            if sentence_sentiment['polarity'] > 0.2:
                positive_phrases.append(sentence_text)
            elif sentence_sentiment['polarity'] < -0.2:
                negative_phrases.append(sentence_text)
            
            # Aggregate word-level sentiment
            positive_words += sentence_sentiment['positive_words']
            negative_words += sentence_sentiment['negative_words']
            
            # Update emotion scores
            for emotion, score in sentence_sentiment['emotions'].items():
                emotion_scores[emotion] += score
        
        # Calculate overall metrics
        total_words = len([token for token in doc if not token.is_punct and not token.is_space])
        
        # Calculate normalized polarity (-1 to 1)
        polarity = 0.0
        if total_words > 0:
            polarity = (positive_words - negative_words) / max(1, total_words)
        
        # Calculate subjectivity (0 to 1)
        subjectivity = 0.0
        if total_words > 0:
            subjectivity = (positive_words + negative_words) / max(1, total_words)
        
        # Determine sentiment category
        sentiment = 'neutral'
        if polarity > 0.1:
            sentiment = 'positive'
        elif polarity < -0.1:
            sentiment = 'negative'
        
        # Normalize emotion scores
        total_emotion_score = sum(emotion_scores.values()) or 1  # Avoid division by zero
        normalized_emotions = {
            emotion: score / total_emotion_score 
            for emotion, score in emotion_scores.items() if score > 0
        }
        
        # Prepare final result
        return {
            'polarity': polarity,
            'subjectivity': subjectivity,
            'sentiment': sentiment,
            'emotions': normalized_emotions,
            'positive_phrases': positive_phrases[:5],  # Limit to top 5
            'negative_phrases': negative_phrases[:5],  # Limit to top 5
            'positive_words': positive_words,
            'negative_words': negative_words,
            'total_words': total_words
        }
    
    def analyze_by_sentence(self, text: str) -> List[Dict[str, Any]]:
        """
        Analyze sentiment of each sentence in text.
        
        Args:
            text: Text to analyze
        
        Returns:
            List of sentiment analyses for each sentence
        """
        # Clean the input text
        clean_text = clean_text_data(text)
        
        if not clean_text:
            return []
        
        # Process with spaCy
        doc = self._nlp(clean_text)
        
        # Analyze each sentence
        sentence_sentiments = []
        
        for sentence in doc.sents:
            sentiment = self._analyze_sentence_sentiment(sentence)
            sentiment['text'] = sentence.text.strip()
            sentence_sentiments.append(sentiment)
        
        return sentence_sentiments
    
    def analyze_aspects(self, text: str, aspects: List[str]) -> Dict[str, Dict[str, Any]]:
        """
        Analyze sentiment towards specific aspects or topics in text.
        
        Args:
            text: Text to analyze
            aspects: List of aspects to analyze sentiment for
        
        Returns:
            Sentiment analysis for each aspect
        """
        # Clean the input text
        clean_text = clean_text_data(text)
        
        if not clean_text or not aspects:
            return {}
        
        # Process with spaCy
        doc = self._nlp(clean_text)
        
        # Initialize results
        aspect_sentiments = {}
        
        for aspect in aspects:
            # Find sentences mentioning the aspect
            aspect_sentences = []
            
            for sentence in doc.sents:
                sentence_text = sentence.text.lower()
                # Check if aspect is mentioned in the sentence
                if aspect.lower() in sentence_text:
                    aspect_sentences.append(sentence)
            
            # If aspect is mentioned, analyze sentiment
            if aspect_sentences:
                # Analyze sentiment for relevant sentences
                sentiment_scores = []
                
                for sentence in aspect_sentences:
                    sentiment = self._analyze_sentence_sentiment(sentence)
                    sentiment_scores.append(sentiment['polarity'])
                
                # Calculate average sentiment
                avg_sentiment = sum(sentiment_scores) / len(sentiment_scores)
                
                # Determine sentiment category
                sentiment_category = 'neutral'
                if avg_sentiment > 0.1:
                    sentiment_category = 'positive'
                elif avg_sentiment < -0.1:
                    sentiment_category = 'negative'
                
                # Store results
                aspect_sentiments[aspect] = {
                    'polarity': avg_sentiment,
                    'sentiment': sentiment_category,
                    'mentions': len(aspect_sentences),
                    'example_sentences': [s.text.strip() for s in aspect_sentences[:3]]  # Top 3 examples
                }
            else:
                # Aspect not mentioned
                aspect_sentiments[aspect] = {
                    'polarity': 0.0,
                    'sentiment': 'neutral',
                    'mentions': 0,
                    'example_sentences': []
                }
        
        return aspect_sentiments
    
    def get_emotion_scores(self, text: str) -> Dict[str, float]:
        """
        Extract emotion scores from text (joy, sadness, anger, etc.).
        
        Args:
            text: Text to analyze
        
        Returns:
            Scores for different emotions
        """
        # Clean the input text
        clean_text = clean_text_data(text)
        
        if not clean_text:
            return {emotion: 0.0 for emotion in self._sentiment_lexicon['emotions']}
        
        # Tokenize
        tokens = tokenize_text(clean_text, 'word')
        tokens = [token.lower() for token in tokens]
        
        # Count emotion words
        emotion_counts = {emotion: 0 for emotion in self._sentiment_lexicon['emotions']}
        
        for token in tokens:
            for emotion, keywords in self._sentiment_lexicon['emotions'].items():
                if token in keywords:
                    emotion_counts[emotion] += 1
        
        # Calculate scores
        total_emotions = sum(emotion_counts.values()) or 1  # Avoid division by zero
        
        emotion_scores = {
            emotion: count / total_emotions
            for emotion, count in emotion_counts.items()
        }
        
        return emotion_scores
    
    def batch_analyze(self, texts: List[str]) -> List[Dict[str, Any]]:
        """
        Analyze sentiment of multiple texts in batch.
        
        Args:
            texts: List of texts to analyze
        
        Returns:
            List of sentiment analyses
        """
        results = []
        
        for text in texts:
            try:
                sentiment = self.analyze(text)
                results.append(sentiment)
            except Exception as e:
                logger.error(f"Error in batch sentiment analysis: {e}")
                results.append({
                    'polarity': 0.0,
                    'subjectivity': 0.0,
                    'sentiment': 'neutral',
                    'error': str(e)
                })
        
        return results
    
    def _analyze_sentence_sentiment(self, sentence) -> Dict[str, Any]:
        """
        Helper method to analyze sentiment of a single sentence.
        
        Args:
            sentence: spaCy Span representing a sentence
            
        Returns:
            Sentiment analysis for the sentence
        """
        tokens = [token for token in sentence if not token.is_punct and not token.is_space]
        
        if not tokens:
            return {
                'polarity': 0.0,
                'positive_words': 0,
                'negative_words': 0,
                'emotions': {emotion: 0 for emotion in self._sentiment_lexicon['emotions']}
            }
        
        # Count positive/negative words
        positive_words = 0
        negative_words = 0
        
        # Track emotions
        emotion_counts = {emotion: 0 for emotion in self._sentiment_lexicon['emotions']}
        
        for token in tokens:
            token_text = token.text.lower()
            
            # Check sentiment lexicon
            if token_text in self._sentiment_lexicon['positive']:
                positive_words += 1
            elif token_text in self._sentiment_lexicon['negative']:
                negative_words += 1
            
            # Check negation (which can flip sentiment)
            if token.dep_ == "neg":
                # Negation typically flips the sentiment of what follows
                continue
            
            # Check intensifiers
            if token.pos_ == "ADV" and token.head.text.lower() in self._sentiment_lexicon['positive']:
                positive_words += 0.5
            elif token.pos_ == "ADV" and token.head.text.lower() in self._sentiment_lexicon['negative']:
                negative_words += 0.5
            
            # Check emotions
            for emotion, keywords in self._sentiment_lexicon['emotions'].items():
                if token_text in keywords:
                    emotion_counts[emotion] += 1
        
        # Calculate polarity
        total_words = len(tokens)
        polarity = (positive_words - negative_words) / total_words if total_words > 0 else 0
        
        return {
            'polarity': polarity,
            'positive_words': positive_words,
            'negative_words': negative_words,
            'emotions': emotion_counts
        }
```

# backend/src/ai-engine/src/utils/text_processing.py
```python
import logging
import re
import string
from collections import Counter
from typing import List, Dict, Any, Tuple, Optional, Set, Union

import nltk
import numpy as np
import spacy
from nltk.corpus import stopwords
from nltk.stem import PorterStemmer
from nltk.tokenize import word_tokenize, sent_tokenize
from sklearn.feature_extraction.text import TfidfVectorizer, CountVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from ..config.settings import NLP_CONFIG
from .data_preprocessing import clean_text_data

# Configure logging
logger = logging.getLogger(__name__)

# Initialize spaCy model
# Load medium-sized English model with word vectors
try:
    nlp = spacy.load('en_core_web_md')
except OSError:
    logger.warning("Spacy model 'en_core_web_md' not found. Downloading...")
    spacy.cli.download('en_core_web_md')
    nlp = spacy.load('en_core_web_md')

# Load NLTK resources
try:
    STOPWORDS = set(nltk.corpus.stopwords.words('english'))
except LookupError:
    logger.warning("NLTK stopwords not found. Downloading...")
    nltk.download('stopwords')
    STOPWORDS = set(nltk.corpus.stopwords.words('english'))

try:
    nltk.word_tokenize("Test")
except LookupError:
    logger.warning("NLTK punkt not found. Downloading...")
    nltk.download('punkt')

# Communication style markers for analysis
COMMUNICATION_STYLE_MARKERS = {
    'direct': ['exactly', 'precisely', 'specifically', 'clearly', 'directly'],
    'indirect': ['perhaps', 'maybe', 'possibly', 'kind of', 'sort of'],
    'analytical': ['analyze', 'consider', 'examine', 'evaluate', 'assess'],
    'intuitive': ['feel', 'sense', 'imagine', 'believe', 'think'],
    'expressive': ['excited', 'love', 'hate', 'amazing', 'terrible'],
    'reserved': ['fine', 'okay', 'acceptable', 'reasonable', 'adequate']
}


def tokenize_text(text: str, level: str = 'word') -> List[str]:
    """
    Tokenize text into words or sentences.
    
    Args:
        text: The text to tokenize
        level: The tokenization level ('word' or 'sentence')
        
    Returns:
        List of tokens (words or sentences)
    """
    # Clean the input text
    cleaned_text = clean_text_data(text)
    
    if not cleaned_text:
        return []
    
    # Tokenize based on specified level
    if level == 'word':
        return word_tokenize(cleaned_text)
    elif level == 'sentence':
        return sent_tokenize(cleaned_text)
    else:
        logger.warning(f"Unknown tokenization level: {level}. Using 'word' level.")
        return word_tokenize(cleaned_text)


def remove_stopwords(tokens: List[str], custom_stopwords: Set[str] = None) -> List[str]:
    """
    Remove common stopwords from tokenized text.
    
    Args:
        tokens: List of tokens to filter
        custom_stopwords: Additional stopwords to remove
        
    Returns:
        Filtered tokens with stopwords removed
    """
    if not tokens:
        return []
    
    # Combine default stopwords with custom stopwords
    all_stopwords = STOPWORDS.copy()
    if custom_stopwords:
        all_stopwords.update(custom_stopwords)
    
    # Filter out stopwords
    return [token for token in tokens if token.lower() not in all_stopwords]


def lemmatize_tokens(tokens: List[str]) -> List[str]:
    """
    Reduce tokens to their base or dictionary form.
    
    Args:
        tokens: List of tokens to lemmatize
        
    Returns:
        Lemmatized tokens
    """
    if not tokens:
        return []
    
    # Join tokens to create a document
    text = ' '.join(tokens)
    
    # Process with spaCy
    doc = nlp(text)
    
    # Extract lemmas
    return [token.lemma_ for token in doc]


def stem_tokens(tokens: List[str]) -> List[str]:
    """
    Reduce tokens to their stems using Porter stemmer.
    
    Args:
        tokens: List of tokens to stem
        
    Returns:
        Stemmed tokens
    """
    if not tokens:
        return []
    
    # Initialize stemmer
    stemmer = PorterStemmer()
    
    # Apply stemming
    return [stemmer.stem(token) for token in tokens]


def extract_entities(text: str, entity_types: List[str] = None) -> Dict[str, List[str]]:
    """
    Extract named entities from text using spaCy.
    
    Args:
        text: Text to analyze
        entity_types: List of entity types to extract (e.g., 'PERSON', 'ORG', 'GPE')
                     If None, extracts all entity types
        
    Returns:
        Dictionary of entity types and their occurrences
    """
    # Clean the input text
    cleaned_text = clean_text_data(text)
    
    if not cleaned_text:
        return {}
    
    # Process with spaCy
    doc = nlp(cleaned_text)
    
    # Extract entities
    entities = {}
    
    for ent in doc.ents:
        # Filter by entity type if specified
        if entity_types and ent.label_ not in entity_types:
            continue
        
        if ent.label_ not in entities:
            entities[ent.label_] = []
        
        entities[ent.label_].append(ent.text)
    
    return entities


def extract_keywords(text: str, top_n: int = 10) -> List[Tuple[str, float]]:
    """
    Extract important keywords from text using TF-IDF.
    
    Args:
        text: Text to analyze
        top_n: Number of top keywords to return
        
    Returns:
        List of top keywords with scores
    """
    # Clean the input text
    cleaned_text = clean_text_data(text)
    
    if not cleaned_text:
        return []
    
    # Tokenize
    tokens = tokenize_text(cleaned_text, 'word')
    
    # Remove stopwords
    filtered_tokens = remove_stopwords(tokens)
    
    if not filtered_tokens:
        return []
    
    # Create a document for TF-IDF
    document = [' '.join(filtered_tokens)]
    
    # Calculate TF-IDF
    try:
        vectorizer = TfidfVectorizer()
        tfidf_matrix = vectorizer.fit_transform(document)
        
        # Get feature names (terms)
        feature_names = vectorizer.get_feature_names_out()
        
        # Extract scores for the first document
        scores = tfidf_matrix.toarray()[0]
        
        # Sort terms by score
        sorted_items = sorted(zip(feature_names, scores), key=lambda x: x[1], reverse=True)
        
        # Return top N keywords
        return sorted_items[:top_n]
    except Exception as e:
        logger.error(f"Error extracting keywords: {e}")
        return []


def calculate_text_similarity(text1: str, text2: str, method: str = 'cosine') -> float:
    """
    Calculate semantic similarity between two texts.
    
    Args:
        text1: First text
        text2: Second text
        method: Similarity method ('cosine', 'spacy', 'jaccard')
        
    Returns:
        Similarity score between 0 and 1
    """
    # Clean the input texts
    cleaned_text1 = clean_text_data(text1)
    cleaned_text2 = clean_text_data(text2)
    
    if not cleaned_text1 or not cleaned_text2:
        return 0.0
    
    if method == 'cosine':
        # TF-IDF Vectorization with Cosine Similarity
        vectorizer = TfidfVectorizer()
        try:
            tfidf_matrix = vectorizer.fit_transform([cleaned_text1, cleaned_text2])
            similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
            return float(similarity)
        except Exception as e:
            logger.error(f"Error calculating cosine similarity: {e}")
            return 0.0
    
    elif method == 'spacy':
        # Use spaCy's vector similarity
        doc1 = nlp(cleaned_text1)
        doc2 = nlp(cleaned_text2)
        
        # Check if documents have vectors
        if doc1.vector_norm and doc2.vector_norm:
            similarity = doc1.similarity(doc2)
            return float(similarity)
        else:
            logger.warning("One or both documents have no vector representation")
            return 0.0
    
    elif method == 'jaccard':
        # Jaccard similarity
        tokens1 = set(tokenize_text(cleaned_text1))
        tokens2 = set(tokenize_text(cleaned_text2))
        
        if not tokens1 or not tokens2:
            return 0.0
        
        intersection = tokens1.intersection(tokens2)
        union = tokens1.union(tokens2)
        
        similarity = len(intersection) / len(union) if union else 0.0
        return similarity
    
    else:
        logger.warning(f"Unknown similarity method: {method}. Using 'cosine' method.")
        return calculate_text_similarity(text1, text2, 'cosine')


def analyze_sentiment(text: str) -> Dict[str, Any]:
    """
    Analyze sentiment of text to determine positivity/negativity.
    
    Args:
        text: Text to analyze
        
    Returns:
        Sentiment analysis with polarity and subjectivity scores
    """
    # Clean the input text
    cleaned_text = clean_text_data(text)
    
    if not cleaned_text:
        return {'polarity': 0.0, 'subjectivity': 0.0, 'sentiment': 'neutral'}
    
    # Process with spaCy
    doc = nlp(cleaned_text)
    
    # Initialize sentiment values
    polarity = 0.0
    subjectivity = 0.0
    
    # Simple lexicon-based approach
    positive_words = 0
    negative_words = 0
    subjective_words = 0
    total_words = len(doc)
    
    # Analyze each token
    for token in doc:
        # Check for sentiment-bearing words using token attributes
        if not token.is_stop and not token.is_punct and token.has_vector:
            # Use spaCy's similarity to known positive/negative words
            if token.similarity(nlp("good")) > 0.6 or token.similarity(nlp("excellent")) > 0.6:
                positive_words += 1
                subjective_words += 1
            elif token.similarity(nlp("bad")) > 0.6 or token.similarity(nlp("terrible")) > 0.6:
                negative_words += 1
                subjective_words += 1
    
    # Calculate polarity (-1 to 1)
    if total_words > 0:
        polarity = (positive_words - negative_words) / total_words
        subjectivity = subjective_words / total_words
    
    # Determine sentiment category
    sentiment = 'neutral'
    if polarity > 0.1:
        sentiment = 'positive'
    elif polarity < -0.1:
        sentiment = 'negative'
    
    return {
        'polarity': polarity,
        'subjectivity': subjectivity,
        'sentiment': sentiment,
        'positive_words': positive_words,
        'negative_words': negative_words,
        'total_words': total_words
    }


def extract_topics(text: str, num_topics: int = 3) -> List[Dict[str, Any]]:
    """
    Extract main topics from text using NLP techniques.
    
    Args:
        text: Text to analyze
        num_topics: Number of topics to extract
        
    Returns:
        List of extracted topics with relevance scores
    """
    # Clean the input text
    cleaned_text = clean_text_data(text)
    
    if not cleaned_text or len(cleaned_text.split()) < 10:
        return []
    
    # Tokenize and preprocess
    tokens = tokenize_text(cleaned_text, 'word')
    tokens = remove_stopwords(tokens)
    tokens = lemmatize_tokens(tokens)
    
    if not tokens:
        return []
    
    # Create document
    document = ' '.join(tokens)
    
    # Simple approach: use term frequency to identify topics
    try:
        # Count term frequency
        vectorizer = CountVectorizer(ngram_range=(1, 2), max_features=100)
        X = vectorizer.fit_transform([document])
        
        # Get feature names and term frequencies
        feature_names = vectorizer.get_feature_names_out()
        term_freq = X.toarray()[0]
        
        # Sort terms by frequency
        sorted_items = sorted(zip(feature_names, term_freq), key=lambda x: x[1], reverse=True)
        
        # Build topics as clusters of related terms
        topics = []
        used_terms = set()
        
        for term, freq in sorted_items:
            if len(topics) >= num_topics:
                break
            
            if term in used_terms:
                continue
                
            # Create a topic
            related_terms = []
            for other_term, other_freq in sorted_items:
                if other_term != term and other_term not in used_terms:
                    # Check if terms are related (using spaCy similarity)
                    similarity = nlp(term).similarity(nlp(other_term))
                    if similarity > 0.5:
                        related_terms.append((other_term, other_freq))
                        used_terms.add(other_term)
                        
                        if len(related_terms) >= 4:  # Limit related terms
                            break
            
            # Add the main term
            used_terms.add(term)
            
            # Create topic with keywords and score
            topic = {
                'main_keyword': term,
                'keywords': [term] + [t[0] for t in related_terms],
                'relevance_score': float(freq / term_freq.sum()),
                'frequency': int(freq)
            }
            
            topics.append(topic)
        
        return topics
        
    except Exception as e:
        logger.error(f"Error extracting topics: {e}")
        return []


def summarize_text(text: str, ratio: float = 0.3) -> str:
    """
    Generate a concise summary of longer text.
    
    Args:
        text: Text to summarize
        ratio: Proportion of original text to include in summary
        
    Returns:
        Summarized text
    """
    # Clean the input text
    cleaned_text = clean_text_data(text)
    
    if not cleaned_text:
        return ""
    
    # Tokenize into sentences
    sentences = tokenize_text(cleaned_text, 'sentence')
    
    if not sentences or len(sentences) <= 3:
        return cleaned_text  # Text is already short
    
    # Calculate sentence scores based on keyword frequency
    word_frequencies = {}
    
    # Process all words
    for sentence in sentences:
        for word in tokenize_text(sentence, 'word'):
            word = word.lower()
            if word not in STOPWORDS:
                if word not in word_frequencies:
                    word_frequencies[word] = 1
                else:
                    word_frequencies[word] += 1
    
    # Normalize frequencies
    max_frequency = max(word_frequencies.values()) if word_frequencies else 1
    for word in word_frequencies:
        word_frequencies[word] = word_frequencies[word] / max_frequency
    
    # Score sentences based on word frequency
    sentence_scores = {}
    for i, sentence in enumerate(sentences):
        for word in tokenize_text(sentence, 'word'):
            if word.lower() in word_frequencies:
                if i not in sentence_scores:
                    sentence_scores[i] = word_frequencies[word.lower()]
                else:
                    sentence_scores[i] += word_frequencies[word.lower()]
    
    # Get top sentences
    num_sentences = max(1, int(len(sentences) * ratio))
    top_indices = sorted(sentence_scores, key=sentence_scores.get, reverse=True)[:num_sentences]
    
    # Sort indices to maintain original order
    top_indices = sorted(top_indices)
    
    # Rebuild summary from selected sentences
    summary_sentences = [sentences[i] for i in top_indices]
    summary = ' '.join(summary_sentences)
    
    return summary


def extract_communication_style(text: str) -> Dict[str, Any]:
    """
    Analyze text to determine the author's communication style.
    
    Args:
        text: Text to analyze
        
    Returns:
        Communication style analysis with dimension scores
    """
    # Clean the input text
    cleaned_text = clean_text_data(text)
    
    if not cleaned_text:
        return {
            'directness': 0.5,
            'analytical_vs_intuitive': 0.5,
            'expressiveness': 0.5,
            'sentence_complexity': 0.5,
            'dominant_style': 'balanced'
        }
    
    # Tokenize text
    sentences = tokenize_text(cleaned_text, 'sentence')
    words = tokenize_text(cleaned_text, 'word')
    
    # Process with spaCy for deeper analysis
    doc = nlp(cleaned_text)
    
    # 1. Analyze directness (direct vs. indirect communication)
    direct_markers = sum(1 for word in words if word.lower() in COMMUNICATION_STYLE_MARKERS['direct'])
    indirect_markers = sum(1 for word in words if word.lower() in COMMUNICATION_STYLE_MARKERS['indirect'])
    
    # Calculate directness score (0 = indirect, 1 = direct)
    directness = 0.5  # Default balanced
    if direct_markers + indirect_markers > 0:
        directness = direct_markers / (direct_markers + indirect_markers)
    
    # 2. Analyze analytical vs. intuitive processing
    analytical_markers = sum(1 for word in words if word.lower() in COMMUNICATION_STYLE_MARKERS['analytical'])
    intuitive_markers = sum(1 for word in words if word.lower() in COMMUNICATION_STYLE_MARKERS['intuitive'])
    
    # Calculate analytical score (0 = intuitive, 1 = analytical)
    analytical_vs_intuitive = 0.5  # Default balanced
    if analytical_markers + intuitive_markers > 0:
        analytical_vs_intuitive = analytical_markers / (analytical_markers + intuitive_markers)
    
    # 3. Analyze expressiveness
    expressive_markers = sum(1 for word in words if word.lower() in COMMUNICATION_STYLE_MARKERS['expressive'])
    reserved_markers = sum(1 for word in words if word.lower() in COMMUNICATION_STYLE_MARKERS['reserved'])
    
    # Calculate expressiveness score (0 = reserved, 1 = expressive)
    expressiveness = 0.5  # Default balanced
    if expressive_markers + reserved_markers > 0:
        expressiveness = expressive_markers / (expressive_markers + reserved_markers)
    
    # 4. Analyze sentence structure and complexity
    avg_sentence_length = len(words) / len(sentences) if sentences else 0
    max_sentence_length = 30  # Threshold for complexity
    
    # Calculate sentence complexity score (0 = simple, 1 = complex)
    sentence_complexity = min(1.0, avg_sentence_length / max_sentence_length)
    
    # Determine dominant style
    style_scores = {
        'direct': directness,
        'analytical': analytical_vs_intuitive,
        'intuitive': 1 - analytical_vs_intuitive,
        'expressive': expressiveness,
        'reserved': 1 - expressiveness,
    }
    
    dominant_style = max(style_scores, key=style_scores.get)
    if max(style_scores.values()) < 0.6:
        dominant_style = 'balanced'
    
    return {
        'directness': directness,
        'analytical_vs_intuitive': analytical_vs_intuitive,
        'expressiveness': expressiveness,
        'sentence_complexity': sentence_complexity,
        'dominant_style': dominant_style,
        'avg_sentence_length': avg_sentence_length
    }


def batch_process_texts(texts: List[str], operation: str, operation_params: Dict[str, Any] = None) -> List[Any]:
    """
    Process multiple texts with the same NLP operation.
    
    Args:
        texts: List of texts to process
        operation: The operation to perform ('tokenize', 'extract_keywords', etc.)
        operation_params: Parameters for the operation
        
    Returns:
        List of operation results for each text
    """
    if not texts:
        return []
    
    operation_params = operation_params or {}
    results = []
    
    # Map operation names to functions
    operation_map = {
        'tokenize': tokenize_text,
        'remove_stopwords': remove_stopwords,
        'lemmatize': lemmatize_tokens,
        'stem': stem_tokens,
        'extract_entities': extract_entities,
        'extract_keywords': extract_keywords,
        'analyze_sentiment': analyze_sentiment,
        'extract_topics': extract_topics,
        'summarize': summarize_text,
        'communication_style': extract_communication_style,
        'similarity': calculate_text_similarity
    }
    
    if operation not in operation_map:
        logger.error(f"Unknown operation: {operation}")
        return []
    
    # Handle special case for similarity (which compares pairs of texts)
    if operation == 'similarity' and len(texts) >= 2 and 'reference_text' not in operation_params:
        # Compare each text to the first text
        reference_text = texts[0]
        return [
            calculate_text_similarity(reference_text, text, 
                                     method=operation_params.get('method', 'cosine'))
            for text in texts[1:]
        ]
    
    # Process each text with the selected operation
    for text in texts:
        try:
            func = operation_map[operation]
            if operation == 'tokenize':
                result = func(text, operation_params.get('level', 'word'))
            elif operation == 'remove_stopwords':
                tokens = tokenize_text(text, 'word')
                result = func(tokens, operation_params.get('custom_stopwords'))
            elif operation == 'lemmatize' or operation == 'stem':
                tokens = tokenize_text(text, 'word')
                result = func(tokens)
            elif operation == 'extract_entities':
                result = func(text, operation_params.get('entity_types'))
            elif operation == 'extract_keywords':
                result = func(text, operation_params.get('top_n', 10))
            elif operation == 'extract_topics':
                result = func(text, operation_params.get('num_topics', 3))
            elif operation == 'summarize':
                result = func(text, operation_params.get('ratio', 0.3))
            elif operation == 'similarity' and 'reference_text' in operation_params:
                result = func(operation_params['reference_text'], text, 
                             operation_params.get('method', 'cosine'))
            else:
                result = func(text)
            
            results.append(result)
        except Exception as e:
            logger.error(f"Error processing text with operation {operation}: {e}")
            # Add a default value based on the operation
            if operation == 'tokenize' or operation == 'remove_stopwords' or operation == 'lemmatize' or operation == 'stem':
                results.append([])
            elif operation == 'extract_entities' or operation == 'analyze_sentiment' or operation == 'communication_style':
                results.append({})
            elif operation == 'extract_keywords' or operation == 'extract_topics':
                results.append([])
            elif operation == 'summarize':
                results.append("")
            elif operation == 'similarity':
                results.append(0.0)
    
    return results


class TextAnalyzer:
    """Class for comprehensive text analysis with multiple NLP techniques."""
    
    def __init__(self, config: Dict[str, Any] = None):
        """
        Initialize the TextAnalyzer with configuration.
        
        Args:
            config: Configuration dictionary for analysis parameters
        """
        self._config = config or NLP_CONFIG
        self._nlp = nlp
        self._stopwords = STOPWORDS
        
        logger.debug("TextAnalyzer initialized")
    
    def analyze(self, text: str, analysis_types: List[str] = None) -> Dict[str, Any]:
        """
        Perform comprehensive analysis of text.
        
        Args:
            text: Text to analyze
            analysis_types: List of analysis types to perform
                           (entities, keywords, sentiment, topics, communication_style)
        
        Returns:
            Comprehensive analysis results
        """
        # Default to all analysis types if none specified
        if analysis_types is None:
            analysis_types = ['entities', 'keywords', 'sentiment', 'topics', 'communication_style']
        
        # Clean and preprocess text
        preprocessed = self.preprocess(text)
        
        if not preprocessed['clean_text']:
            return {'error': 'Empty or invalid text'}
        
        # Initialize results dictionary with basic information
        results = {
            'text_length': len(preprocessed['clean_text']),
            'word_count': len(preprocessed['tokens']),
            'sentence_count': len(preprocessed['sentences'])
        }
        
        # Add requested analysis results
        if 'entities' in analysis_types:
            results['entities'] = self.extract_entities(text)
        
        if 'keywords' in analysis_types:
            results['keywords'] = self.extract_keywords(text)
        
        if 'sentiment' in analysis_types:
            results['sentiment'] = self.analyze_sentiment(text)
        
        if 'topics' in analysis_types:
            results['topics'] = self.extract_topics(text)
        
        if 'communication_style' in analysis_types:
            results['communication_style'] = self.extract_communication_style(text)
        
        return results
    
    def preprocess(self, text: str, remove_stopwords: bool = False, lemmatize: bool = False) -> Dict[str, Any]:
        """
        Preprocess text for analysis.
        
        Args:
            text: Text to preprocess
            remove_stopwords: Whether to remove stopwords
            lemmatize: Whether to lemmatize tokens
        
        Returns:
            Preprocessed text in various formats
        """
        # Clean text
        clean_text = clean_text_data(text)
        
        if not clean_text:
            return {
                'raw_text': text,
                'clean_text': '',
                'tokens': [],
                'sentences': [],
                'doc': None
            }
        
        # Tokenize
        tokens = tokenize_text(clean_text, 'word')
        sentences = tokenize_text(clean_text, 'sentence')
        
        # Remove stopwords if requested
        if remove_stopwords:
            tokens = [token for token in tokens if token.lower() not in self._stopwords]
        
        # Lemmatize if requested
        if lemmatize:
            tokens = lemmatize_tokens(tokens)
        
        # Process with spaCy
        doc = self._nlp(clean_text)
        
        return {
            'raw_text': text,
            'clean_text': clean_text,
            'tokens': tokens,
            'sentences': sentences,
            'doc': doc
        }
    
    def extract_entities(self, text: str, entity_types: List[str] = None) -> Dict[str, List[str]]:
        """
        Extract named entities from text.
        
        Args:
            text: Text to analyze
            entity_types: List of entity types to extract
        
        Returns:
            Extracted entities by type
        """
        return extract_entities(text, entity_types)
    
    def extract_keywords(self, text: str, top_n: int = 10) -> List[Tuple[str, float]]:
        """
        Extract important keywords from text.
        
        Args:
            text: Text to analyze
            top_n: Number of top keywords to return
        
        Returns:
            Top keywords with scores
        """
        return extract_keywords(text, top_n)
    
    def analyze_sentiment(self, text: str) -> Dict[str, Any]:
        """
        Analyze sentiment of text.
        
        Args:
            text: Text to analyze
        
        Returns:
            Sentiment analysis results
        """
        return analyze_sentiment(text)
    
    def extract_topics(self, text: str, num_topics: int = 3) -> List[Dict[str, Any]]:
        """
        Extract main topics from text.
        
        Args:
            text: Text to analyze
            num_topics: Number of topics to extract
        
        Returns:
            Extracted topics with keywords
        """
        return extract_topics(text, num_topics)
    
    def extract_communication_style(self, text: str) -> Dict[str, Any]:
        """
        Analyze communication style from text.
        
        Args:
            text: Text to analyze
        
        Returns:
            Communication style analysis
        """
        return extract_communication_style(text)
    
    def compare_texts(self, text1: str, text2: str, method: str = 'cosine') -> Dict[str, float]:
        """
        Compare two texts for similarity.
        
        Args:
            text1: First text
            text2: Second text
            method: Similarity method
        
        Returns:
            Similarity analysis with multiple metrics
        """
        # Calculate similarity with the specified method
        primary_similarity = calculate_text_similarity(text1, text2, method)
        
        # Calculate additional similarity metrics for comparison
        results = {
            f'{method}_similarity': primary_similarity
        }
        
        # Add alternative similarity metrics if the primary method isn't one of these
        if method != 'cosine':
            results['cosine_similarity'] = calculate_text_similarity(text1, text2, 'cosine')
        
        if method != 'spacy':
            results['spacy_similarity'] = calculate_text_similarity(text1, text2, 'spacy')
        
        if method != 'jaccard':
            results['jaccard_similarity'] = calculate_text_similarity(text1, text2, 'jaccard')
        
        return results
    
    def batch_analyze(self, texts: List[str], analysis_types: List[str] = None) -> List[Dict[str, Any]]:
        """
        Analyze multiple texts in batch.
        
        Args:
            texts: List of texts to analyze
            analysis_types: List of analysis types to perform
        
        Returns:
            List of analysis results for each text
        """
        results = []
        
        for text in texts:
            try:
                analysis = self.analyze(text, analysis_types)
                results.append(analysis)
            except Exception as e:
                logger.error(f"Error in batch analysis: {e}")
                results.append({'error': str(e)})
        
        return results


class TextVectorizer:
    """Class for converting text to vector representations for similarity and clustering."""
    
    def __init__(self, config: Dict[str, Any] = None):
        """
        Initialize the TextVectorizer with configuration.
        
        Args:
            config: Configuration dictionary for vectorization parameters
        """
        self._config = config or NLP_CONFIG
        self._vectorizer = None
        self._model = None
        
        # Initialize vectorizer based on config
        vectorizer_type = self._config.get('vectorizer_type', 'tfidf')
        
        if vectorizer_type == 'tfidf':
            self._vectorizer = TfidfVectorizer(
                max_features=self._config.get('max_features', 10000),
                ngram_range=self._config.get('ngram_range', (1, 1)),
                stop_words=self._config.get('stop_words', 'english')
            )
        elif vectorizer_type == 'count':
            self._vectorizer = CountVectorizer(
                max_features=self._config.get('max_features', 10000),
                ngram_range=self._config.get('ngram_range', (1, 1)),
                stop_words=self._config.get('stop_words', 'english')
            )
        else:
            logger.warning(f"Unknown vectorizer type: {vectorizer_type}. Using TF-IDF.")
            self._vectorizer = TfidfVectorizer(
                max_features=self._config.get('max_features', 10000),
                ngram_range=self._config.get('ngram_range', (1, 1)),
                stop_words=self._config.get('stop_words', 'english')
            )
        
        logger.debug(f"TextVectorizer initialized with {vectorizer_type} vectorizer")
    
    def fit(self, texts: List[str]) -> None:
        """
        Fit the vectorizer on a corpus of texts.
        
        Args:
            texts: List of texts to fit on
        """
        if not texts:
            logger.warning("Empty corpus provided for fitting")
            return
        
        # Preprocess texts
        preprocessed_texts = [clean_text_data(text) for text in texts]
        preprocessed_texts = [text for text in preprocessed_texts if text]
        
        if not preprocessed_texts:
            logger.warning("No valid texts after preprocessing")
            return
        
        # Fit vectorizer
        try:
            self._vectorizer.fit(preprocessed_texts)
            logger.debug(f"Vectorizer fitted on {len(preprocessed_texts)} texts")
        except Exception as e:
            logger.error(f"Error fitting vectorizer: {e}")
    
    def transform(self, text: str) -> np.ndarray:
        """
        Transform text to vector representation.
        
        Args:
            text: Text to transform
        
        Returns:
            Vector representation of text
        """
        if not self._vectorizer:
            raise ValueError("Vectorizer not fitted. Call fit() first.")
        
        # Preprocess text
        preprocessed_text = clean_text_data(text)
        
        if not preprocessed_text:
            logger.warning("Empty text after preprocessing")
            return np.zeros((1, 1))
        
        # Transform text
        try:
            vector = self._vectorizer.transform([preprocessed_text])
            return vector
        except Exception as e:
            logger.error(f"Error transforming text: {e}")
            return np.zeros((1, 1))
    
    def fit_transform(self, corpus: List[str], text: str) -> np.ndarray:
        """
        Fit vectorizer on corpus and transform a text.
        
        Args:
            corpus: List of texts to fit on
            text: Text to transform
        
        Returns:
            Vector representation of text
        """
        self.fit(corpus)
        return self.transform(text)
    
    def batch_transform(self, texts: List[str]) -> np.ndarray:
        """
        Transform multiple texts to vector representations.
        
        Args:
            texts: List of texts to transform
        
        Returns:
            Matrix of vector representations
        """
        if not self._vectorizer:
            raise ValueError("Vectorizer not fitted. Call fit() first.")
        
        if not texts:
            return np.zeros((0, 0))
        
        # Preprocess texts
        preprocessed_texts = [clean_text_data(text) for text in texts]
        preprocessed_texts = [text if text else "" for text in preprocessed_texts]
        
        # Transform texts
        try:
            vectors = self._vectorizer.transform(preprocessed_texts)
            return vectors
        except Exception as e:
            logger.error(f"Error batch transforming texts: {e}")
            return np.zeros((len(texts), 1))
    
    def calculate_similarity(self, text1: str, text2: str, method: str = 'cosine') -> float:
        """
        Calculate similarity between two texts.
        
        Args:
            text1: First text
            text2: Second text
            method: Similarity method
        
        Returns:
            Similarity score
        """
        # Ensure vectorizer is fitted
        if not self._vectorizer:
            corpus = [text1, text2]
            self.fit(corpus)
        
        # Transform texts
        vector1 = self.transform(text1)
        vector2 = self.transform(text2)
        
        # Calculate similarity
        if method == 'cosine':
            try:
                similarity = cosine_similarity(vector1, vector2)[0][0]
                return float(similarity)
            except Exception as e:
                logger.error(f"Error calculating cosine similarity: {e}")
                return 0.0
        elif method == 'euclidean':
            try:
                distance = np.linalg.norm(vector1.toarray() - vector2.toarray())
                # Convert distance to similarity score (0-1)
                similarity = 1 / (1 + distance)
                return float(similarity)
            except Exception as e:
                logger.error(f"Error calculating euclidean similarity: {e}")
                return 0.0
        else:
            logger.warning(f"Unknown similarity method: {method}. Using cosine.")
            return self.calculate_similarity(text1, text2, 'cosine')
    
    def calculate_similarity_matrix(self, texts: List[str], method: str = 'cosine') -> np.ndarray:
        """
        Calculate similarity matrix for a list of texts.
        
        Args:
            texts: List of texts to compare
            method: Similarity method
        
        Returns:
            Similarity matrix
        """
        if not texts:
            return np.zeros((0, 0))
        
        # Ensure vectorizer is fitted
        if not self._vectorizer:
            self.fit(texts)
        
        # Transform all texts
        vectors = self.batch_transform(texts)
        
        # Calculate similarity matrix
        if method == 'cosine':
            try:
                similarity_matrix = cosine_similarity(vectors)
                return similarity_matrix
            except Exception as e:
                logger.error(f"Error calculating similarity matrix: {e}")
                return np.zeros((len(texts), len(texts)))
        else:
            logger.warning(f"Unknown similarity method: {method}. Using cosine.")
            return self.calculate_similarity_matrix(texts, 'cosine')


class SentimentAnalyzer:
    """Specialized class for sentiment analysis of text."""
    
    def __init__(self, config: Dict[str, Any] = None):
        """
        Initialize the SentimentAnalyzer with configuration.
        
        Args:
            config: Configuration dictionary for sentiment analysis parameters
        """
        self._config = config or NLP_CONFIG
        self._nlp = nlp
        
        # Initialize sentiment lexicon
        self._sentiment_lexicon = {
            'positive': [
                'good', 'great', 'excellent', 'wonderful', 'amazing', 'fantastic',
                'happy', 'joy', 'love', 'like', 'enjoy', 'pleased', 'satisfied'
            ],
            'negative': [
                'bad', 'terrible', 'awful', 'horrible', 'poor', 'disappointing',
                'sad', 'angry', 'hate', 'dislike', 'unhappy', 'disappointed'
            ],
            'emotions': {
                'joy': ['happy', 'joyful', 'excited', 'delighted', 'glad'],
                'sadness': ['sad', 'unhappy', 'depressed', 'gloomy', 'disappointed'],
                'anger': ['angry', 'furious', 'outraged', 'annoyed', 'irritated'],
                'fear': ['afraid', 'scared', 'frightened', 'terrified', 'anxious'],
                'surprise': ['surprised', 'amazed', 'astonished', 'shocked'],
                'disgust': ['disgusted', 'repulsed', 'revolted', 'appalled']
            }
        }
        
        logger.debug("SentimentAnalyzer initialized")
    
    def analyze(self, text: str) -> Dict[str, Any]:
        """
        Analyze sentiment of text.
        
        Args:
            text: Text to analyze
        
        Returns:
            Detailed sentiment analysis
        """
        # Clean and preprocess text
        clean_text = clean_text_data(text)
        
        if not clean_text:
            return {
                'polarity': 0.0,
                'subjectivity': 0.0,
                'sentiment': 'neutral',
                'emotions': {},
                'positive_phrases': [],
                'negative_phrases': []
            }
        
        # Process with spaCy for syntactic analysis
        doc = self._nlp(clean_text)
        
        # Initialize counters and containers
        positive_words = 0
        negative_words = 0
        positive_phrases = []
        negative_phrases = []
        emotion_scores = {emotion: 0 for emotion in self._sentiment_lexicon['emotions']}
        
        # Analyze document for sentiment
        for sentence in doc.sents:
            sentence_text = sentence.text.strip()
            sentence_sentiment = self._analyze_sentence_sentiment(sentence)
            
            # Track positive/negative phrases
            if sentence_sentiment['polarity'] > 0.2:
                positive_phrases.append(sentence_text)
            elif sentence_sentiment['polarity'] < -0.2:
                negative_phrases.append(sentence_text)
            
            # Aggregate word-level sentiment
            positive_words += sentence_sentiment['positive_words']
            negative_words += sentence_sentiment['negative_words']
            
            # Update emotion scores
            for emotion, score in sentence_sentiment['emotions'].items():
                emotion_scores[emotion] += score
        
        # Calculate overall metrics
        total_words = len([token for token in doc if not token.is_punct and not token.is_space])
        
        # Calculate normalized polarity (-1 to 1)
        polarity = 0.0
        if total_words > 0:
            polarity = (positive_words - negative_words) / max(1, total_words)
        
        # Calculate subjectivity (0 to 1)
        subjectivity = 0.0
        if total_words > 0:
            subjectivity = (positive_words + negative_words) / max(1, total_words)
        
        # Determine sentiment category
        sentiment = 'neutral'
        if polarity > 0.1:
            sentiment = 'positive'
        elif polarity < -0.1:
            sentiment = 'negative'
        
        # Normalize emotion scores
        total_emotion_score = sum(emotion_scores.values()) or 1  # Avoid division by zero
        normalized_emotions = {
            emotion: score / total_emotion_score 
            for emotion, score in emotion_scores.items() if score > 0
        }
        
        # Prepare final result
        return {
            'polarity': polarity,
            'subjectivity': subjectivity,
            'sentiment': sentiment,
            'emotions': normalized_emotions,
            'positive_phrases': positive_phrases[:5],  # Limit to top 5
            'negative_phrases': negative_phrases[:5],  # Limit to top 5
            'positive_words': positive_words,
            'negative_words': negative_words,
            'total_words': total_words
        }
    
    def analyze_by_sentence(self, text: str) -> List[Dict[str, Any]]:
        """
        Analyze sentiment of each sentence in text.
        
        Args:
            text: Text to analyze
        
        Returns:
            List of sentiment analyses for each sentence
        """
        # Clean the input text
        clean_text = clean_text_data(text)
        
        if not clean_text:
            return []
        
        # Process with spaCy
        doc = self._nlp(clean_text)
        
        # Analyze each sentence
        sentence_sentiments = []
        
        for sentence in doc.sents:
            sentiment = self._analyze_sentence_sentiment(sentence)
            sentiment['text'] = sentence.text.strip()
            sentence_sentiments.append(sentiment)
        
        return sentence_sentiments
    
    def analyze_aspects(self, text: str, aspects: List[str]) -> Dict[str, Dict[str, Any]]:
        """
        Analyze sentiment towards specific aspects or topics in text.
        
        Args:
            text: Text to analyze
            aspects: List of aspects to analyze sentiment for
        
        Returns:
            Sentiment analysis for each aspect
        """
        # Clean the input text
        clean_text = clean_text_data(text)
        
        if not clean_text or not aspects:
            return {}
        
        # Process with spaCy
        doc = self._nlp(clean_text)
        
        # Initialize results
        aspect_sentiments = {}
        
        for aspect in aspects:
            # Find sentences mentioning the aspect
            aspect_sentences = []
            
            for sentence in doc.sents:
                sentence_text = sentence.text.lower()
                # Check if aspect is mentioned in the sentence
                if aspect.lower() in sentence_text:
                    aspect_sentences.append(sentence)
            
            # If aspect is mentioned, analyze sentiment
            if aspect_sentences:
                # Analyze sentiment for relevant sentences
                sentiment_scores = []
                
                for sentence in aspect_sentences:
                    sentiment = self._analyze_sentence_sentiment(sentence)
                    sentiment_scores.append(sentiment['polarity'])
                
                # Calculate average sentiment
                avg_sentiment = sum(sentiment_scores) / len(sentiment_scores)
                
                # Determine sentiment category
                sentiment_category = 'neutral'
                if avg_sentiment > 0.1:
                    sentiment_category = 'positive'
                elif avg_sentiment < -0.1:
                    sentiment_category = 'negative'
                
                # Store results
                aspect_sentiments[aspect] = {
                    'polarity': avg_sentiment,
                    'sentiment': sentiment_category,
                    'mentions': len(aspect_sentences),
                    'example_sentences': [s.text.strip() for s in aspect_sentences[:3]]  # Top 3 examples
                }
            else:
                # Aspect not mentioned
                aspect_sentiments[aspect] = {
                    'polarity': 0.0,
                    'sentiment': 'neutral',
                    'mentions': 0,
                    'example_sentences': []
                }
        
        return aspect_sentiments
    
    def get_emotion_scores(self, text: str) -> Dict[str, float]:
        """
        Extract emotion scores from text (joy, sadness, anger, etc.).
        
        Args:
            text: Text to analyze
        
        Returns:
            Scores for different emotions
        """
        # Clean the input text
        clean_text = clean_text_data(text)
        
        if not clean_text:
            return {emotion: 0.0 for emotion in self._sentiment_lexicon['emotions']}
        
        # Tokenize
        tokens = tokenize_text(clean_text, 'word')
        tokens = [token.lower() for token in tokens]
        
        # Count emotion words
        emotion_counts = {emotion: 0 for emotion in self._sentiment_lexicon['emotions']}
        
        for token in tokens:
            for emotion, keywords in self._sentiment_lexicon['emotions'].items():
                if token in keywords:
                    emotion_counts[emotion] += 1
        
        # Calculate scores
        total_emotions = sum(emotion_counts.values()) or 1  # Avoid division by zero
        
        emotion_scores = {
            emotion: count / total_emotions
            for emotion, count in emotion_counts.items()
        }
        
        return emotion_scores
    
    def batch_analyze(self, texts: List[str]) -> List[Dict[str, Any]]:
        """
        Analyze sentiment of multiple texts in batch.
        
        Args:
            texts: List of texts to analyze
        
        Returns:
            List of sentiment analyses
        """
        results = []
        
        for text in texts:
            try:
                sentiment = self.analyze(text)
                results.append(sentiment)
            except Exception as e:
                logger.error(f"Error in batch sentiment analysis: {e}")
                results.append({
                    'polarity': 0.0,
                    'subjectivity': 0.0,
                    'sentiment': 'neutral',
                    'error': str(e)
                })
        
        return results
    
    def _analyze_sentence_sentiment(self, sentence) -> Dict[str, Any]:
        """
        Helper method to analyze sentiment of a single sentence.
        
        Args:
            sentence: spaCy Span representing a sentence
            
        Returns:
            Sentiment analysis for the sentence
        """
        tokens = [token for token in sentence if not token.is_punct and not token.is_space]
        
        if not tokens:
            return {
                'polarity': 0.0,
                'positive_words': 0,
                'negative_words': 0,
                'emotions': {emotion: 0 for emotion in self._sentiment_lexicon['emotions']}
            }
        
        # Count positive/negative words
        positive_words = 0
        negative_words = 0
        
        # Track emotions
        emotion_counts = {emotion: 0 for emotion in self._sentiment_lexicon['emotions']}
        
        for token in tokens:
            token_text = token.text.lower()
            
            # Check sentiment lexicon
            if token_text in self._sentiment_lexicon['positive']:
                positive_words += 1
            elif token_text in self._sentiment_lexicon['negative']:
                negative_words += 1
            
            # Check negation (which can flip sentiment)
            if token.dep_ == "neg":
                # Negation typically flips the sentiment of what follows
                continue
            
            # Check intensifiers
            if token.pos_ == "ADV" and token.head.text.lower() in self._sentiment_lexicon['positive']:
                positive_words += 0.5
            elif token.pos_ == "ADV" and token.head.text.lower() in self._sentiment_lexicon['negative']:
                negative_words += 0.5
            
            # Check emotions
            for emotion, keywords in self._sentiment_lexicon['emotions'].items():
                if token_text in keywords:
                    emotion_counts[emotion] += 1
        
        # Calculate polarity
        total_words = len(tokens)
        polarity = (positive_words - negative_words) / total_words if total_words > 0 else 0
        
        return {
            'polarity': polarity,
            'positive_words': positive_words,
            'negative_words': negative_words,
            'emotions': emotion_counts
        }