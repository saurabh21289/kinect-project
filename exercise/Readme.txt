I. Server Initiation (Code 3)

✓	bufferBodyFrames = [];
✓ bufferTrial = [];
✓	gtArray=[];
✓	exArray=[];
✓	systemState = 3;
✓	openBodyReader();

✓	C->S: 'connection'
✓	S-b->C 'init' & systemState (constantly triggered by 'bodyFrame')
	Client:
✓	change Text Label to 'Start' label
✓	liveupdateCanvas1()

--------------------------------------------------------------------------------
Transition State from Init to Recording (3 - 1) or Live to Recording(0 - 1)
Trigger:	C->S 'command'

Server
✓	bufferBodyFrames = [];
	Check the number of bodies in FOV
Client
	Lock the tracking object to the specific body
--------------------------------------------------------------------------------
II. Recording (Rec, Code 1)
Server
✓	bufferBodyFrames.push(bodyFrame)

✓	S-b->C:'rec' & bodyFrame & systemState (constantly triggered by 'bodyFrame')
✓	C: Change Text Label to 'Stop' label

✓	C->S: 'connection'
✓	S->C: 'rec' & bodyFrame & systemState
✓	Client: Change Text Label to 'Stop' label

Client
✓	liveupdateCanvas1()

--------------------------------------------------------------------------------
Transition State from Recording to Result Display (1 - 2)
Trigger:	rx: 'command'

Server
✓	closeBodyReader()
✓	bufferTrial.push(bufferBodyFrames) // avoid multiple push

-----------------------------------------------------

III. Result Display ('disp', Code 2)
Server

✓	S-b->C: 'disp' & bufferBodyFrames & typeofTest & currentrecordid
✓	C->S: 'connection'
✓	S->C:  'disp' & bufferBodyFrames & typeofTest & currentrecordid

✓	C: animateCanvas1()
✓	C->S: 'choose',pushto(gtarray) or pushto(exarray)
	C->S: 'analyze'
	S->C: 'report', chartData, radarData

	C->S: 'curveRequest' & number
	S->C: 'curvePlot' & curveData

	C->S 'save'

-----------------------------------------------------
Transition State from Result Display - Live (2 - 0)
✓	openBodyReader()

-----------------------------------------------------
IV. Live ('live', Code 0)

Server
✓	S-b->C: 'live' & bufferBodyFrames & typeofTest & currentrecordid
✓	C: liveupdateCanvas1()
✓	C->S: 'connection'
✓	S->C:  'disp' & bufferBodyFrames & typeofTest & currentrecordid
✓	C: liveupdateCanvas1()
--