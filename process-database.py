# prepare-data.py
#
# Prepares data stored in a BSON-encoded MongoDB database for analysis by 
# creating a folder structure with all references resolved that can be 
# navigated manually.
#
# This script depends on PyMongo (http://api.mongodb.org/python/1.7/).
#
# Written by Michael Gubbels (www.michaelgubbels.com)

# The collections in the sciencekit database:
#
# $ mongo 
# MongoDB shell version: 2.4.0
# connecting to: test
# Server has startup warnings: 
# Tue Sep  3 19:09:33.049 [initandlisten] 
# Tue Sep  3 19:09:33.049 [initandlisten] ** WARNING: soft rlimits too low. Number of files is 256, should be at least 1000
# > use sciencekit
# switched to db sciencekit
# > show collections
# accesstokens
# accounts
# authorizationcodes
# bumps
# clients
# collaborations
# identities
# moments
# observations
# pages
# photos
# questions
# sequences
# sketches
# stories
# system.indexes
# tags
# texts
# timelines
# videos

import csv
import datetime
import os
import pymongo
# from PIL import Image
from base64 import decodestring

# Output directory information
path = './Processed Data'
if not os.path.exists(path):
	os.makedirs(path)

# Connect to database and get database
dbConnection = pymongo.Connection('localhost', 27017)
db = dbConnection.sciencekit

collection = db['videos']

# db.collection_names()
# collection.count()
# collection.find_one()['date']

# /moments/<MOMENT>/<entryType>/
# 1. Create CSV
# 2. Create directory structure
# 3. Copy data into directory structure

# Create "./moments" folder
# if not os.path.exists(path + '/moments'):
# 	os.makedirs(path + '/moments')

# Store Accounts
with open(path + '/accounts.csv', 'wb') as csvfile:
	spamwriter = csv.writer(csvfile, delimiter='\t', quotechar='\"', quoting=csv.QUOTE_MINIMAL)

	# Write accounts
	accounts = db['accounts']
	for account in accounts.find(): # Get Account
		csvRow = []

		identifier = account['_id']
		csvRow.append(identifier)

		username = account['username']
		csvRow.append(username)

		# Write to CSV file
		#spamwriter.writerow([date] + [author['username']] + [entryType])
		spamwriter.writerow(csvRow)

# Store Moments
with open(path + '/entries.csv', 'wb') as csvfile:
	spamwriter = csv.writer(csvfile, delimiter='\t', quotechar='\"', quoting=csv.QUOTE_MINIMAL)

	# Write headings
	csvRow = ['Entry ID', 'Entry Date', 'Entry Author', 'Entry Type', 'Entry Revision ID', 'Entry Revision Date', 'Photo Entry URI', 'Video Entry URI', 'Sketch Entry URI', 'Question Entry Text', 'Observation Entry Cause', 'Observation Entry Effect', 'Sequence Entry Step Count', 'Sequence Entry Steps', 'Tag Count', 'Tags', 'Vote Count', 'Collaboration ID', 'Collaborator Count', 'Collaborators', 'Identity ID', 'Identity Date', 'Identity (Most recent since Entry Revision Date)']
	spamwriter.writerow(csvRow)

	# Write moments
	moments = db['moments']
	for moment in moments.find(): # Get Moment
		csvRow = []

		# Process moment

		# Get ID
		uid = moment['_id']
		csvRow.append(uid)

		# Get date
		date = moment['date']
		csvRow.append(date)

		# Get account
		author = moment['author']
		author = db['accounts'].find_one({ '_id': author })
		csvRow.append(author['username'])

		# Get entryType
		entryType = moment['entryType']
		csvRow.append(entryType)

		# Get entry
		entryId = moment['entry']
		entry = None
		if entryType == 'Text':
			entry = db['texts'].find_one({ '_id': entryId })
			csvRow.append(entry['_id'])
			csvRow.append(entry['date'])
			csvRow = csvRow + [''] * 8
		elif entryType == 'Photo':
			entry = db['photos'].find_one({ '_id': entryId })
			csvRow.append(entry['_id'])
			csvRow.append(entry['date'])
			csvRow.append(entry['uri'])
			csvRow = csvRow + [''] * 7
		elif entryType == 'Video':
			entry = db['videos'].find_one({ '_id': entryId })
			csvRow.append(entry['_id'])
			csvRow.append(entry['date'])
			csvRow = csvRow + [''] * 1
			csvRow.append(entry['uri'])
			csvRow = csvRow + [''] * 6
		elif entryType == 'Sketch':
			entry = db['sketches'].find_one({ '_id': entryId })
			csvRow.append(entry['_id'])
			csvRow.append(entry['date'])
			csvRow = csvRow + [''] * 2
			csvRow.append('/sketches/' + str(entry['_id']) + '.png')
			csvRow = csvRow + [''] * 5
			# print entry['imageData']
			# TODO: Write imageData to image file
		elif entryType == 'Question':
			entry = db['questions'].find_one({ '_id': entryId })
			csvRow.append(entry['_id'])
			csvRow.append(entry['date'])
			csvRow = csvRow + [''] * 3
			csvRow.append(entry['question'])
			csvRow = csvRow + [''] * 4
		elif entryType == 'Observation':
			entry = db['observations'].find_one({ '_id': entryId })
			csvRow.append(entry['_id'])
			csvRow.append(entry['date'])
			csvRow = csvRow + [''] * 4
			csvRow.append(entry['cause'])
			csvRow.append(entry['effect'])
			csvRow = csvRow + [''] * 2
		elif entryType == 'Sequence':
			entry = db['sequences'].find_one({ '_id': entryId })
			csvRow.append(entry['_id'])
			csvRow.append(entry['date'])
			csvRow = csvRow + [''] * 6
			stepCount = len(entry['steps']) # Step count
			csvRow.append(stepCount)
			stepList = []
			stepNumber = 0
			for step in entry['steps']:
				stepList.append('[' + str(stepNumber) + '] ' + step['step'])
				stepNumber = stepNumber + 1
			stepString = '; '.join(stepList) # Semicolon-separated list
			csvRow.append(stepString)
			# csvRow.append(entry['_id'])
			# csvRow.append(entry['question'])
			# csvRow.append(entry['_id'])
			# TODO: Iterate through steps, list each step.

		# Get tags for entry
		tags = db['tags']
		tagCount = tags.find({ 'entry': uid }).count()
		csvRow.append(tagCount)
		tagList = []
		tagString = ''
		tagNumber = 0
		for tag in tags.find({ 'entry': uid }): # Get Tag	
			tagList.append('[' + str(tagNumber) + '] ' + tag['text'])
			tagNumber = tagNumber + 1
		tagString = '; '.join(tagList)
		csvRow.append(tagString)

		# Get bumps for entry
		bumpCount = db['bumps'].find({ 'entry': uid }).count()
		csvRow.append(bumpCount)

		# Get collaborators for entry
		collaboration = db['collaborations'].find_one({ 'entry': uid })
		if collaboration == None:
			csvRow.append('')
			csvRow.append('0')
			csvRow.append('')
		else:
			collaborationCount = len(collaboration['authors']) # Step count
			csvRow.append(collaboration['_id'])
			csvRow.append(collaborationCount)
			collaborationList = []
			collaborationNumber = 0
			for collaborator in collaboration['authors']:
				collaboratorAuthorObjectId = collaborator['author']
				collaboratorAuthor = db['accounts'].find_one({ '_id': collaboratorAuthorObjectId })
				collaborationList.append('[' + str(collaborationNumber) + '] ' + collaboratorAuthor['username'])
				collaborationNumber = collaborationNumber + 1
			collaborationString = '; '.join(collaborationList) # Semicolon-separated list
			csvRow.append(collaborationString)

		# Get identity for entry
		identities = db['identities'].find({ 'author': author['_id'], 'date': { '$gte': entry['date'] } }).sort('date')
		if identities.count() > 0:
			identity = identities[0]
			csvRow.append(identity['_id'])
			csvRow.append(identity['date'])
			csvRow.append(identity['identity'])
			# print identity['identity']
		else:
			csvRow.append('')

		# Write to CSV file
		#spamwriter.writerow([date] + [author['username']] + [entryType])
		spamwriter.writerow(csvRow)

# NOTES
# - Don't have tags per user. I list tags per entry without the author to keep thing simple. I can get that though.
# - Don't have bumps per user. (Ditto.)

# Store Tags
with open(path + '/tags.csv', 'wb') as csvfile:
	spamwriter = csv.writer(csvfile, delimiter='\t', quotechar='\"', quoting=csv.QUOTE_MINIMAL)

	# Write tags
	tags = db['tags']
	for tag in tags.find(): # Get Tag
		csvRow = []

		# Get ID
		uid = account['_id']
		csvRow.append(uid)

		# Get date
		date = tag['date']
		csvRow.append(date)

		# Get account
		author = tag['account']
		author = db['accounts'].find_one({ '_id': author })
		csvRow.append(author['username'])

		# Get entry
		entry = tag['entry']
		csvRow.append(entry)

		# Write to CSV file
		spamwriter.writerow(csvRow)

# Store Sketches
moments = db['moments']
for moment in moments.find({ 'entryType': 'Sketch' }): # Get Moments for Sketches

	# Get ID
	uid = moment['_id']
	csvRow.append(uid)

	# Get entry
	entryId = moment['entry']
	entry = db['sketches'].find_one({ '_id': entryId })

	with open(path + '/sketches/' + str(entry['_id']) + '.png', 'wb') as sketchImageFile:
		#csvRow.append(entry['_id'])
		imageData = entry['imageData']
		imageData = imageData[imageData.find('base64,')+7:]
		sketchImageFile.write(imageData.decode('base64'))

# accounts
# bumps
# tags
# collaborations
# identities (?)
# pages (?)
# stories

# TODO: Output statistics
# - Photo, video, etc. count
# - Tag count
# - Step count in sequence
