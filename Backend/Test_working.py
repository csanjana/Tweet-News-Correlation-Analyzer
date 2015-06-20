from flask import Flask, render_template
from newspaper import Article
import json
from flask.ext.cors import CORS
from elasticsearch import Elasticsearch
import urllib2
import urllib
import json
import unirest
app = Flask(__name__)
cors = CORS(app)

@app.route("/parseNews/<topic>/<url>")
def parseNews(topic, url):
    print("Inside hello method")
    print topic
    # url = 'http://www.theguardian.com/technology/live/2015/mar/09/apple-watch-macbook-launch-event-smartwatch-spring-forward'
    # url = 'http:~~www.theguardian.com~technology~live~2015~mar~09~apple-watch-macbook-launch-event-smartwatch-spring-forward'
    url = url.replace('~', '/')
    article = Article(url)
    article.download()
    article.parse()
    text = article.text
    article.nlp()
    art_keywords = article.keywords
    art_summary = article.summary
    # print text
    print type(art_summary)
  #  art_summary = unicodedata.normalize('NFKD', art_summary).encode('ascii','ignore')
    print art_summary
    # print art_keywords
    returned_tweets = get_tweets(topic, art_keywords)
    returned_tweets["summary"] = str(art_summary.encode('ascii','ignore').decode('utf-8'))
    # return ''.join(art_keywords)
    return json.dumps(returned_tweets)


def getSentiment(tweet):
    # url = 'https://japerk-text-processing.p.mashape.com/sentiment/'
    # values = {'text' : tweet.encode('ascii', 'ignore').decode('utf-8')}
    # data = urllib.urlencode(values)
    # response = urllib2.urlopen(url, data)
    # parsed_result = json.loads(response.read())
    # sentiment = parsed_result["label"]
    # return sentiment
    response = unirest.post("https://japerk-text-processing.p.mashape.com/sentiment/",
    headers={
    "X-Mashape-Key": "a23pXvae7wmshR2Dp3G0AjpuMckjp1s9Ci4jsncCKHtL42SOmF",
    "Content-Type": "application/x-www-form-urlencoded",
    "Accept": "application/json"
    },
    params={
    "language": "english",
    "text": "great movie"
    })

    parsed_result = json.loads(response.read())
    sentiment = parsed_result["label"]
    return sentiment


def get_tweets(topic, keywords):
    print "======Inside get tweets======="
    print topic, keywords
    index_name = str(topic)+'_index'
    es = Elasticsearch()
    all_tweets = {}
    tweet_all_details = {}
    feature_sentiment = {}
    word_freq = {}
    feature_data = []
    for keyword in keywords:
        word = str(keyword)
        #print "The word is"+ str(type(word))
        #print word
        query = '{"query": {"match": {"text": "'+word+'"}}}'
        #print query
        res = es.search(index=index_name, body=query)
        all_tweets[keyword]=res['hits']['hits']
        chart_data = []
        pos = 0
        neg = 0
        neutral = 0
        for rec in res['hits']['hits']:
            tweet = rec['_source']['text']
            split_tweet = tweet.split(" ")
            for word in split_tweet:
                lower_word = word.lower()
                if lower_word in word_freq:
                    word_freq[lower_word]+=1
                else:
                    word_freq[lower_word] = 1
            sentiment = getSentiment(tweet)
            if sentiment=="pos":
                pos+=1
            elif sentiment=="neg":
                neg+=1
            else:
                neutral+=1
            #print(sentiment + '-' + tweet)
        tweet_sentiment = {}
        tweet_sentiment['label']="Positive"
        tweet_sentiment['value']= pos
        tweet_sentiment['color'] = "#04B404"
        chart_data.append(tweet_sentiment)
        tweet_sentiment = {}
        tweet_sentiment['label']="Negative"
        tweet_sentiment['value']= neg
        tweet_sentiment['color'] = "#FF3300"
        chart_data.append(tweet_sentiment)
        tweet_sentiment = {}
        tweet_sentiment['label']="Neutral"
        tweet_sentiment['value']= neutral
        tweet_sentiment['color'] = "#0066FF"
        chart_data.append(tweet_sentiment)
        feature_sentiment[keyword] = json.dumps(chart_data)

        # For the summary graph
        feature = {'Feature': keyword, 'freq': {'pos': pos, 'neg' : neg, 'neu': neutral}}
        feature_data.append(feature)

    word_cloud_list = []
    count = 0
    for key in sorted(word_freq, key=word_freq.get, reverse=True):
        if count<200:
            word_cloud_format = {}
            word_cloud_format['text']=key
            word_cloud_format['weight']=word_freq[key]
            word_cloud_list.append(word_cloud_format)
            count+=1
        else:
            break
    tweet_all_details["word_cloud"] = json.dumps(word_cloud_list)
    tweet_all_details["all_tweets"] = all_tweets
    tweet_all_details["sentiment_chart"] = feature_sentiment
    tweet_all_details["feature_data"] = json.dumps(feature_data)
    print "****Tweet all details****"
    print tweet_all_details
    return tweet_all_details

if __name__ == "__main__":
    app.debug = True
    app.run()
