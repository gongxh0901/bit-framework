interface saveFileSuccessCb {
	(
		result: {
			/**
		  * 文件保存路径
		  */
			apFilePath: string
		}
	): void
}
interface getFileInfoSuccessCb {
	(
		result: {
			/**
		  * 文件大小，单位：字节
		  */
			size: number
		}
	): void
}
interface getSavedFileInfoSuccessCb {
	(
		result: {
			/**
		  * 文件大小，单位：字节
		  */
			size: number
			/**
		  * Unix 时间戳，精确到秒
		  */
			createTime: number
		}
	): void
}
interface getSavedFileListSuccessCb {
	(
		result: {
			/**
		  * 文件列表
		  */
			fileList: _PlainObject[]
		}
	): void
}
interface removeSavedFileSuccessCb {
	(
		result: {
		}
	): void
}
interface setStorageSuccessCb {
	(
		result: {
		}
	): void
}
interface setStorageSyncSuccessCb {
	(
		result: {
		}
	): void
}
interface getStorageSuccessCb {
	(
		result: {
			/**
		  * key对应的内容
		  */
			data: _PlainObject | string
		}
	): void
}
interface getStorageSyncSuccessCb {
	(
		result: {
		}
	): void
}
interface removeStorageSuccessCb {
	(
		result: {
		}
	): void
}
interface removeStorageSyncSuccessCb {
	(
		result: {
		}
	): void
}
interface getStorageInfoSuccessCb {
	(
		result: {
			/**
		  * 当前占用的空间大小, 单位KB
		  */
			currentSize: number
		}
	): void
}
interface getClipboardSuccessCb {
	(
		result: {
			/**
		  * 剪贴板数据
		  */
			text: string
		}
	): void
}
interface setClipboardSuccessCb {
	(
		result: {
		}
	): void
}
interface makePhoneCallSuccessCb {
	(
		result: {
		}
	): void
}
interface getNetworkTypeSuccessCb {
	(
		result: {
			/**
		  * 网络类型值 "UNKNOWN" / "NOTREACHABLE" / "WIFI" / "3G" / "2G" / "4G" / "WWAN"
		  */
			networkType: string
		}
	): void
}
interface setKeepScreenOnSuccessCb {
	(
		result: {
		}
	): void
}
interface getScreenBrightnessSuccessCb {
	(
		result: {
		}
	): void
}
interface setScreenBrightnessSuccessCb {
	(
		result: {
		}
	): void
}
interface watchShakeSuccessCb {
	(
		result: {
		}
	): void
}
interface getSystemInfoSuccessCb {
	(
		result: {
			/**
		  * 手机型号
		  */
			model: string
			/**
		  * 设备像素比
		  */
			pixelRatio: number
			/**
		  * 窗口宽度
		  */
			windowWidth: number
			/**
		  * 窗口高度
		  */
			windowHeight: number
			/**
		  * 客户端设置的语言
		  */
			language: string
			/**
		  * 客户端版本号
		  */
			version: string
			/**
		  * 设备磁盘容量（暂不支持）
		  */
			storage: string
			/**
		  * 当前电量百分比（暂不支持）
		  */
			currentBattery: string
			/**
		  * 系统版本
		  */
			system: string
			/**
		  * 系统名：Android，iOS
		  */
			platform: string
			/**
		  * 屏幕宽度
		  */
			screenWidth: number
			/**
		  * 屏幕高度
		  */
			screenHeight: number
			/**
		  * 手机品牌
		  */
			brand: string
			/**
		  * 用户设置字体大小
		  */
			fontSizeSetting: number
			/**
		  * 当前运行的客户端
		  */
			app: string
		}
	): void
}
interface choosePhoneContactSuccessCb {
	(
		result: {
			/**
		  * 选中的联系人姓名
		  */
			name: string
			/**
		  * 选中的联系人手机号
		  */
			mobile: string
		}
	): void
}
interface vibrateSuccessCb {
	(
		result: {
		}
	): void
}
interface getLocationSuccessCb {
	(
		result: {
			/**
		  * 经度
		  */
			longitude: string
			/**
		  * 纬度
		  */
			latitude: string
			/**
		  * 精确度，单位m
		  */
			accuracy: string
			/**
		  * 省份
		  */
			province: string
			/**
		  * 城市
		  */
			city: string
			/**
		  * 城市级别的地区代码
		  */
			cityAdcode: string
			/**
		  * 区县
		  */
			district: string
			/**
		  * 需要街道级别逆地理的才会有的字段,街道门牌信息，结构是：{street, number}
		  */
			streetNumber: _PlainObject
		}
	): void
}
interface chooseCitySuccessCb {
	(
		result: {
			/**
		  * 城市名
		  */
			city: string
			/**
		  * 行政区划代码
		  */
			adCode: string
		}
	): void
}
interface createInnerAudioContextSuccessCb {
	(
		result: {
		}
	): void
}
interface chooseImageSuccessCb {
	(
		result: {
			/**
		  * 图片的本地文件路径列表
		  */
			apFilePaths: string[]
		}
	): void
}
interface previewImageSuccessCb {
	(
		result: {
		}
	): void
}
interface getImageInfoSuccessCb {
	(
		result: {
			/**
		  * 图片宽度，单位px
		  */
			width: number
			/**
		  * 图片高度，单位px
		  */
			height: number
			/**
		  * 返回图片的本地路径
		  */
			path: string
			/**
		  * 返回图片的格式
		  */
			type: string
		}
	): void
}
interface saveImageSuccessCb {
	(
		result: {
		}
	): void
}
interface compressImageSuccessCb {
	(
		result: {
			/**
		  * 压缩后的路径数组
		  */
			apFilePaths: string[]
		}
	): void
}
interface chooseVideoSuccessCb {
	(
		result: {
			/**
		  * 选定视频的临时文件路径
		  */
			tempFilePath: string
			/**
		  * 选定视频的时间长度
		  */
			duration: number
			/**
		  * 选定视频的数据量大小
		  */
			size: number
			/**
		  * 返回选定视频的长
		  */
			height: number
			/**
		  * 返回选定视频的宽
		  */
			width: number
		}
	): void
}
interface saveVideoToPhotosAlbumSuccessCb {
	(
		result: {
		}
	): void
}
interface uploadFileSuccessCb {
	(
		result: {
			/**
		  * 服务器返回的数据
		  */
			data: string
			/**
		  * HTTP 状态码
		  */
			statusCode: string
			/**
		  * 服务器返回的 header
		  */
			header: _PlainObject
		}
	): void
}
interface downloadFileSuccessCb {
	(
		result: {
			/**
		  * 文件临时存放的位置
		  */
			apFilePath: string
		}
	): void
}
interface sendMtopSuccessCb {
	(
		result: any
	): void
}
interface httpRequestSuccessCb {
	(
		result: {
			/**
		  * 响应数据，格式取决于请求时的 dataType 参数
		  */
			data: any
			/**
		  * 响应码
		  */
			status: number
			/**
		  * 响应头
		  */
			headers: _PlainObject
		}
	): void
}
interface connectSocketSuccessCb {
	(
		result: {
		}
	): void
}
interface sendSocketMessageSuccessCb {
	(
		result: {
		}
	): void
}
interface closeSocketSuccessCb {
	(
		result: {
		}
	): void
}
interface getTBCodeSuccessCb {
	(
		result: {
			/**
		  * 获取到的 Code
		  */
			code: string
		}
	): void
}
interface getTBSessionInfoSuccessCb {
	(
		result: {
			data: {
				/** 获取到的 skey */
				skey: string
			}
		}
	): void
}
interface setTBSessionInfoSuccessCb {
	(
		result: {
		}
	): void
}
interface tradePaySuccessCb {
	(
		result: {
			/**
		  * 支付结果状态码，详见下表
		  */
			resultCode: string
		}
	): void
}
interface getAuthUserInfoSuccessCb {
	(
		result: {
			/**
		  * 用户昵称
		  */
			nickName: string
			/**
		  * 会员 ID
		  */
			userId: string
			/**
		  * 用户头像链接
		  */
			avatar: string
		}
	): void
}
interface shareTinyAppMsgSuccessCb {
	(
		result: {
		}
	): void
}
interface setShareAppMessageSuccessCb {
	(
		result: {
		}
	): void
}
interface pageScrollToSuccessCb {
	(
		result: {
		}
	): void
}
interface createAnimationSuccessCb {
	(
		result: {
		}
	): void
}
interface datePickerSuccessCb {
	(
		result: {
			/**
		  * 选择的日期
		  */
			date: string
		}
	): void
}
interface alertSuccessCb {
	(
		result: {
		}
	): void
}
interface confirmSuccessCb {
	(
		result: {
			/**
		  * 点击 confirm 返回 true，点击 cancel 返回false
		  */
			confirm: boolean
		}
	): void
}
interface promptSuccessCb {
	(
		result: {
		}
	): void
}
interface showToastSuccessCb {
	(
		result: {
		}
	): void
}
interface hideToastSuccessCb {
	(
		result: {
		}
	): void
}
interface showLoadingSuccessCb {
	(
		result: {
		}
	): void
}
interface hideLoadingSuccessCb {
	(
		result: {
		}
	): void
}
interface showActionSheetSuccessCb {
	(
		result: {
		}
	): void
}
interface hideKeyboardSuccessCb {
	(
		result: {
		}
	): void
}
interface navigateToSuccessCb {
	(
		result: {
		}
	): void
}
interface redirectToSuccessCb {
	(
		result: {
		}
	): void
}
interface navigateBackSuccessCb {
	(
		result: {
		}
	): void
}
interface setNavigationBarSuccessCb {
	(
		result: {
		}
	): void
}
interface getNavigationBarHeightSuccessCb {
	(
		result: {
			/**
		  * 导航栏高度
		  */
			height: number
		}
	): void
}
interface getStatusBarHeightSuccessCb {
	(
		result: {
			/**
		  * 状态栏高度
		  */
			height: number
		}
	): void
}
interface setBackgroundImageSuccessCb {
	(
		result: {
		}
	): void
}
interface removeBackgroundImageSuccessCb {
	(
		result: {
		}
	): void
}
interface setViewTopSuccessCb {
	(
		result: {
		}
	): void
}
interface setCanPullDownSuccessCb {
	(
		result: {
		}
	): void
}
interface showSkuSuccessCb {
	(
		result: {
		}
	): void
}
interface hideSkuSuccessCb {
	(
		result: {
		}
	): void
}
interface switchTabSuccessCb {
	(
		result: {
		}
	): void
}
interface showTabBarSuccessCb {
	(
		result: {
		}
	): void
}
interface hideTabBarSuccessCb {
	(
		result: {
		}
	): void
}
interface setTabBarStyleSuccessCb {
	(
		result: {
		}
	): void
}
interface setTabBarItemSuccessCb {
	(
		result: {
		}
	): void
}
interface setTabBarBadgeSuccessCb {
	(
		result: {
		}
	): void
}
interface removeTabBarBadgeSuccessCb {
	(
		result: {
		}
	): void
}
interface showTabBarRedDotSuccessCb {
	(
		result: {
		}
	): void
}
interface hideTabBarRedDotSuccessCb {
	(
		result: {
		}
	): void
}

interface saveFileFailCb {
	(
		error: _PlainObject
	): void
}
interface getFileInfoFailCb {
	(
		error: _PlainObject
	): void
}
interface getSavedFileInfoFailCb {
	(
		error: _PlainObject
	): void
}
interface getSavedFileListFailCb {
	(
		error: _PlainObject
	): void
}
interface removeSavedFileFailCb {
	(
		error: _PlainObject
	): void
}
interface setStorageFailCb {
	(
		error: _PlainObject
	): void
}
interface setStorageSyncFailCb {
	(
		error: _PlainObject
	): void
}
interface getStorageFailCb {
	(
		error: _PlainObject
	): void
}
interface getStorageSyncFailCb {
	(
		error: _PlainObject
	): void
}
interface removeStorageFailCb {
	(
		error: _PlainObject
	): void
}
interface removeStorageSyncFailCb {
	(
		error: _PlainObject
	): void
}
interface getStorageInfoFailCb {
	(
		error: _PlainObject
	): void
}
interface getClipboardFailCb {
	(
		error: _PlainObject
	): void
}
interface setClipboardFailCb {
	(
		error: _PlainObject
	): void
}
interface makePhoneCallFailCb {
	(
		error: _PlainObject
	): void
}
interface getNetworkTypeFailCb {
	(
		error: _PlainObject
	): void
}
interface setKeepScreenOnFailCb {
	(
		error: _PlainObject
	): void
}
interface getScreenBrightnessFailCb {
	(
		error: _PlainObject
	): void
}
interface setScreenBrightnessFailCb {
	(
		error: _PlainObject
	): void
}
interface watchShakeFailCb {
	(
		error: _PlainObject
	): void
}
interface getSystemInfoFailCb {
	(
		error: _PlainObject
	): void
}
interface choosePhoneContactFailCb {
	(
		error: _PlainObject
	): void
}
interface vibrateFailCb {
	(
		error: _PlainObject
	): void
}
interface getLocationFailCb {
	(
		error: _PlainObject
	): void
}
interface chooseCityFailCb {
	(
		error: _PlainObject
	): void
}
interface createInnerAudioContextFailCb {
	(
		error: _PlainObject
	): void
}
interface chooseImageFailCb {
	(
		error: _PlainObject
	): void
}
interface previewImageFailCb {
	(
		error: _PlainObject
	): void
}
interface getImageInfoFailCb {
	(
		error: _PlainObject
	): void
}
interface saveImageFailCb {
	(
		error: _PlainObject
	): void
}
interface compressImageFailCb {
	(
		error: _PlainObject
	): void
}
interface chooseVideoFailCb {
	(
		error: _PlainObject
	): void
}
interface saveVideoToPhotosAlbumFailCb {
	(
		error: _PlainObject
	): void
}
interface uploadFileFailCb {
	(
		error: _PlainObject
	): void
}
interface downloadFileFailCb {
	(
		error: _PlainObject
	): void
}
interface sendMtopFailCb {
	(
		error: _PlainObject
	): void
}
interface httpRequestFailCb {
	(
		error: _PlainObject
	): void
}
interface connectSocketFailCb {
	(
		error: _PlainObject
	): void
}
interface sendSocketMessageFailCb {
	(
		error: _PlainObject
	): void
}
interface closeSocketFailCb {
	(
		error: _PlainObject
	): void
}
interface getTBCodeFailCb {
	(
		error: _PlainObject
	): void
}
interface getTBSessionInfoFailCb {
	(
		error: _PlainObject
	): void
}
interface setTBSessionInfoFailCb {
	(
		error: _PlainObject
	): void
}
interface tradePayFailCb {
	(
		error: _PlainObject
	): void
}
interface getAuthUserInfoFailCb {
	(
		error: _PlainObject
	): void
}
interface shareTinyAppMsgFailCb {
	(
		error: _PlainObject
	): void
}
interface setShareAppMessageFailCb {
	(
		error: _PlainObject
	): void
}
interface pageScrollToFailCb {
	(
		error: _PlainObject
	): void
}
interface createAnimationFailCb {
	(
		error: _PlainObject
	): void
}
interface datePickerFailCb {
	(
		error: _PlainObject
	): void
}
interface alertFailCb {
	(
		error: _PlainObject
	): void
}
interface confirmFailCb {
	(
		error: _PlainObject
	): void
}
interface promptFailCb {
	(
		error: _PlainObject
	): void
}
interface showToastFailCb {
	(
		error: _PlainObject
	): void
}
interface hideToastFailCb {
	(
		error: _PlainObject
	): void
}
interface showLoadingFailCb {
	(
		error: _PlainObject
	): void
}
interface hideLoadingFailCb {
	(
		error: _PlainObject
	): void
}
interface showActionSheetFailCb {
	(
		error: _PlainObject
	): void
}
interface hideKeyboardFailCb {
	(
		error: _PlainObject
	): void
}
interface navigateToFailCb {
	(
		error: _PlainObject
	): void
}
interface redirectToFailCb {
	(
		error: _PlainObject
	): void
}
interface navigateBackFailCb {
	(
		error: _PlainObject
	): void
}
interface setNavigationBarFailCb {
	(
		error: _PlainObject
	): void
}
interface getNavigationBarHeightFailCb {
	(
		error: _PlainObject
	): void
}
interface getStatusBarHeightFailCb {
	(
		error: _PlainObject
	): void
}
interface setBackgroundImageFailCb {
	(
		error: _PlainObject
	): void
}
interface removeBackgroundImageFailCb {
	(
		error: _PlainObject
	): void
}
interface setViewTopFailCb {
	(
		error: _PlainObject
	): void
}
interface setCanPullDownFailCb {
	(
		error: _PlainObject
	): void
}
interface showSkuFailCb {
	(
		error: _PlainObject
	): void
}
interface hideSkuFailCb {
	(
		error: _PlainObject
	): void
}
interface switchTabFailCb {
	(
		error: _PlainObject
	): void
}
interface showTabBarFailCb {
	(
		error: _PlainObject
	): void
}
interface hideTabBarFailCb {
	(
		error: _PlainObject
	): void
}
interface setTabBarStyleFailCb {
	(
		error: _PlainObject
	): void
}
interface setTabBarItemFailCb {
	(
		error: _PlainObject
	): void
}
interface setTabBarBadgeFailCb {
	(
		error: _PlainObject
	): void
}
interface removeTabBarBadgeFailCb {
	(
		error: _PlainObject
	): void
}
interface showTabBarRedDotFailCb {
	(
		error: _PlainObject
	): void
}
interface hideTabBarRedDotFailCb {
	(
		error: _PlainObject
	): void
}

interface onNetworkStatusChangeCallback {
	(
		result: {
			/**
		  * 网络类型值 "UNKNOWN" / "NOTREACHABLE" / "WIFI" / "3G" / "2G" / "4G" / "WWAN"
		  */
			networkType: string
		}
	): void
}
interface offNetworkStatusChangeCallback {
	(
	): void
}
interface onSocketOpenCallback {
	(
		result: {
		}
	): void
}
interface offSocketOpenCallback {
	(
	): void
}
interface onSocketErrorCallback {
	(
		result: {
		}
	): void
}
interface offSocketErrorCallback {
	(
		result: {
		}
	): void
}
interface onSocketMessageCallback {
	(
		result: {
			/**
		  * 服务器返回的消息：普通的文本 String 或者经 base64 编码后的 String
		  */
			data: string | ArrayBuffer
			/**
		  * 如果此字段值为true，data字段表示接收到的经过了 base64 编码后的 String，否则 data 字段表示接收到的普通 String 文本。
		  */
			isBuffer: boolean
		}
	): void
}
interface offSocketMessageCallback {
	(
	): void
}
interface onSocketCloseCallback {
	(
		result: {
		}
	): void
}
interface offSocketCloseCallback {
	(
	): void
}

interface saveFileOptions {
	/**
	  * 文件路径
	  */
	apFilePath: string
	/** 调用成功的回调函数*/
	success?: saveFileSuccessCb
	/** 调用失败的回调函数 */
	fail?: saveFileFailCb
	/** 调用结束的回调函数（调用成功、失败都会执行） */
	complete?: saveFileSuccessCb | saveFileFailCb
}
interface getFileInfoOptions {
	/**
	  * 文件路径
	  */
	apFilePath: string
	/** 调用成功的回调函数*/
	success?: getFileInfoSuccessCb
	/** 调用失败的回调函数 */
	fail?: getFileInfoFailCb
	/** 调用结束的回调函数（调用成功、失败都会执行） */
	complete?: getFileInfoSuccessCb | getFileInfoFailCb
}
interface getSavedFileInfoOptions {
	/**
	  * 文件路径
	  */
	apFilePath: string
	/** 调用成功的回调函数*/
	success?: getSavedFileInfoSuccessCb
	/** 调用失败的回调函数 */
	fail?: getSavedFileInfoFailCb
	/** 调用结束的回调函数（调用成功、失败都会执行） */
	complete?: getSavedFileInfoSuccessCb | getSavedFileInfoFailCb
}
interface getSavedFileListOptions {
	/** 调用成功的回调函数*/
	success?: getSavedFileListSuccessCb
	/** 调用失败的回调函数 */
	fail?: getSavedFileListFailCb
	/** 调用结束的回调函数（调用成功、失败都会执行） */
	complete?: getSavedFileListSuccessCb | getSavedFileListFailCb
}
interface removeSavedFileOptions {
	/**
	  * 文件路径
	  */
	apFilePath: string
	/** 调用成功的回调函数*/
	success?: removeSavedFileSuccessCb
	/** 调用失败的回调函数 */
	fail?: removeSavedFileFailCb
	/** 调用结束的回调函数（调用成功、失败都会执行） */
	complete?: removeSavedFileSuccessCb | removeSavedFileFailCb
}
interface setStorageOptions {
	/**
	  * 缓存数据的key
	  */
	key: string
	/**
	  * 要缓存的数据
	  */
	data: string
	/** 调用成功的回调函数*/
	success?: setStorageSuccessCb
	/** 调用失败的回调函数 */
	fail?: setStorageFailCb
	/** 调用结束的回调函数（调用成功、失败都会执行） */
	complete?: setStorageSuccessCb | setStorageFailCb
}
interface setStorageSyncOptions {
	/**
	  * 缓存数据的key
	  */
	key: string
	/**
	  * 要缓存的数据
	  */
	data: _PlainObject | string
	/** 调用成功的回调函数*/
	success?: setStorageSyncSuccessCb
	/** 调用失败的回调函数 */
	fail?: setStorageSyncFailCb
	/** 调用结束的回调函数（调用成功、失败都会执行） */
	complete?: setStorageSyncSuccessCb | setStorageSyncFailCb
}
interface getStorageOptions {
	/**
	  * 缓存数据的key
	  */
	key: string
	/** 调用成功的回调函数*/
	success?: getStorageSuccessCb
	/** 调用失败的回调函数 */
	fail?: getStorageFailCb
	/** 调用结束的回调函数（调用成功、失败都会执行） */
	complete?: getStorageSuccessCb | getStorageFailCb
}
interface getStorageSyncOptions {
	/**
	  * 缓存数据的key
	  */
	key: string
	/** 调用成功的回调函数*/
	success?: getStorageSyncSuccessCb
	/** 调用失败的回调函数 */
	fail?: getStorageSyncFailCb
	/** 调用结束的回调函数（调用成功、失败都会执行） */
	complete?: getStorageSyncSuccessCb | getStorageSyncFailCb
}
interface removeStorageOptions {
	/**
	  * 缓存数据的key
	  */
	key: string
	/** 调用成功的回调函数*/
	success?: removeStorageSuccessCb
	/** 调用失败的回调函数 */
	fail?: removeStorageFailCb
	/** 调用结束的回调函数（调用成功、失败都会执行） */
	complete?: removeStorageSuccessCb | removeStorageFailCb
}
interface removeStorageSyncOptions {
	/**
	  * 缓存数据的key
	  */
	key: string
	/** 调用成功的回调函数*/
	success?: removeStorageSyncSuccessCb
	/** 调用失败的回调函数 */
	fail?: removeStorageSyncFailCb
	/** 调用结束的回调函数（调用成功、失败都会执行） */
	complete?: removeStorageSyncSuccessCb | removeStorageSyncFailCb
}
interface getStorageInfoOptions {
	/** 调用成功的回调函数*/
	success?: getStorageInfoSuccessCb
	/** 调用失败的回调函数 */
	fail?: getStorageInfoFailCb
	/** 调用结束的回调函数（调用成功、失败都会执行） */
	complete?: getStorageInfoSuccessCb | getStorageInfoFailCb
}
interface getClipboardOptions {
	/** 调用成功的回调函数*/
	success?: getClipboardSuccessCb
	/** 调用失败的回调函数 */
	fail?: getClipboardFailCb
	/** 调用结束的回调函数（调用成功、失败都会执行） */
	complete?: getClipboardSuccessCb | getClipboardFailCb
}
interface setClipboardOptions {
	/**
	  * 剪贴板数据
	  */
	text: string
	/** 调用成功的回调函数*/
	success?: setClipboardSuccessCb
	/** 调用失败的回调函数 */
	fail?: (res: AliyMiniprogram.CallBack.Fail) => void;
	/** 调用结束的回调函数（调用成功、失败都会执行） */
	complete?: setClipboardSuccessCb | setClipboardFailCb
}
interface makePhoneCallOptions {
	/**
	  * 电话号码
	  */
	number: string
	/** 调用成功的回调函数*/
	success?: makePhoneCallSuccessCb
	/** 调用失败的回调函数 */
	fail?: makePhoneCallFailCb
	/** 调用结束的回调函数（调用成功、失败都会执行） */
	complete?: makePhoneCallSuccessCb | makePhoneCallFailCb
}
interface getNetworkTypeOptions {
	/** 调用成功的回调函数*/
	success?: getNetworkTypeSuccessCb
	/** 调用失败的回调函数 */
	fail?: getNetworkTypeFailCb
	/** 调用结束的回调函数（调用成功、失败都会执行） */
	complete?: getNetworkTypeSuccessCb | getNetworkTypeFailCb
}
interface setKeepScreenOnOptions {
	/**
	  * 是否保持屏幕长亮状态
	  */
	keepScreenOn: boolean
	/** 调用成功的回调函数*/
	success?: setKeepScreenOnSuccessCb
	/** 调用失败的回调函数 */
	fail?: setKeepScreenOnFailCb
	/** 调用结束的回调函数（调用成功、失败都会执行） */
	complete?: setKeepScreenOnSuccessCb | setKeepScreenOnFailCb
}
interface getScreenBrightnessOptions {
	/** 调用成功的回调函数*/
	success?: getScreenBrightnessSuccessCb
	/** 调用失败的回调函数 */
	fail?: getScreenBrightnessFailCb
	/** 调用结束的回调函数（调用成功、失败都会执行） */
	complete?: getScreenBrightnessSuccessCb | getScreenBrightnessFailCb
}
interface setScreenBrightnessOptions {
	/**
	  * 需要设置的屏幕亮度，取值范围0-1
	  */
	brightness: number
	/** 调用成功的回调函数*/
	success?: setScreenBrightnessSuccessCb
	/** 调用失败的回调函数 */
	fail?: setScreenBrightnessFailCb
	/** 调用结束的回调函数（调用成功、失败都会执行） */
	complete?: setScreenBrightnessSuccessCb | setScreenBrightnessFailCb
}
interface watchShakeOptions {
	/** 调用成功的回调函数*/
	success?: watchShakeSuccessCb
	/** 调用失败的回调函数 */
	fail?: watchShakeFailCb
	/** 调用结束的回调函数（调用成功、失败都会执行） */
	complete?: watchShakeSuccessCb | watchShakeFailCb
}
interface getSystemInfoOptions {
	/** 调用成功的回调函数*/
	success?: getSystemInfoSuccessCb
	/** 调用失败的回调函数 */
	fail?: getSystemInfoFailCb
	/** 调用结束的回调函数（调用成功、失败都会执行） */
	complete?: getSystemInfoSuccessCb | getSystemInfoFailCb
}
interface choosePhoneContactOptions {
	/** 调用成功的回调函数*/
	success?: choosePhoneContactSuccessCb
	/** 调用失败的回调函数 */
	fail?: choosePhoneContactFailCb
	/** 调用结束的回调函数（调用成功、失败都会执行） */
	complete?: choosePhoneContactSuccessCb | choosePhoneContactFailCb
}
interface vibrateOptions {
	/** 调用成功的回调函数*/
	success?: vibrateSuccessCb
	/** 调用失败的回调函数 */
	fail?: vibrateFailCb
	/** 调用结束的回调函数（调用成功、失败都会执行） */
	complete?: vibrateSuccessCb | vibrateFailCb
}
interface getLocationOptions {
	/** 调用成功的回调函数*/
	success?: getLocationSuccessCb
	/** 调用失败的回调函数 */
	fail?: getLocationFailCb
	/** 调用结束的回调函数（调用成功、失败都会执行） */
	complete?: getLocationSuccessCb | getLocationFailCb
}
interface chooseCityOptions {
	/**
	  * 是否显示当前定位城市，默认 false
	  */
	showLocatedCity?: boolean
	/**
	  * 是否显示热门城市，默认 true
	  */
	showHotCities?: boolean
	/**
	  * 自定义城市列表，列表内对象字段见下表
	  */
	cities?: _PlainObject[]
	/**
	  * 自定义热门城市列表，列表内对象字段见下表
	  */
	hotCities?: _PlainObject[]
	/** 调用成功的回调函数*/
	success?: chooseCitySuccessCb
	/** 调用失败的回调函数 */
	fail?: chooseCityFailCb
	/** 调用结束的回调函数（调用成功、失败都会执行） */
	complete?: chooseCitySuccessCb | chooseCityFailCb
}
interface createInnerAudioContextOptions {
	/**
	  * 音频文件路径
	  */
	src: string
	/** 调用成功的回调函数*/
	success?: createInnerAudioContextSuccessCb
	/** 调用失败的回调函数 */
	fail?: createInnerAudioContextFailCb
	/** 调用结束的回调函数（调用成功、失败都会执行） */
	complete?: createInnerAudioContextSuccessCb | createInnerAudioContextFailCb
}
interface chooseImageOptions {
	/**
	  * 最多可以选择的图片张数，默认1
	  */
	count?: number
	/**
	  * album 从相册选图，camera 使用相机，默认二者都有
	  */
	sourceType?: string[]
	/** 调用成功的回调函数*/
	success?: chooseImageSuccessCb
	/** 调用失败的回调函数 */
	fail?: chooseImageFailCb
	/** 调用结束的回调函数（调用成功、失败都会执行） */
	complete?: chooseImageSuccessCb | chooseImageFailCb
}
interface previewImageOptions {
	/**
	  * 当前显示图片的链接，不填则默认为 urls 的第一张
	  */
	current?: string
	/**
	  * 需要预览的图片链接列表
	  */
	urls: string[]
	/** 调用成功的回调函数*/
	success?: previewImageSuccessCb
	/** 调用失败的回调函数 */
	fail?: previewImageFailCb
	/** 调用结束的回调函数（调用成功、失败都会执行） */
	complete?: previewImageSuccessCb | previewImageFailCb
}
interface getImageInfoOptions {
	/**
	  * 图片的路径，可以是相对路径，临时文件路径，存储文件路径，网络图片路径
	  */
	src: string
	/** 调用成功的回调函数*/
	success?: getImageInfoSuccessCb
	/** 调用失败的回调函数 */
	fail?: getImageInfoFailCb
	/** 调用结束的回调函数（调用成功、失败都会执行） */
	complete?: getImageInfoSuccessCb | getImageInfoFailCb
}
interface saveImageOptions {
	/**
	  * 图片文件路径，可以是临时文件路径也可以是永久文件路径，不支持网络图片路径
	  */
	url: string
	/**
	  * 是否显示图片操作菜单，默认 true
	  */
	showActionSheet?: boolean
	/** 调用成功的回调函数*/
	success?: saveImageSuccessCb
	/** 调用失败的回调函数 */
	fail?: saveImageFailCb
	/** 调用结束的回调函数（调用成功、失败都会执行） */
	complete?: saveImageSuccessCb | saveImageFailCb
}
interface compressImageOptions {
	/**
	  * 要压缩的图片地址数组
	  */
	apFilePaths: string[]
	/**
	  * 压缩级别，支持 0 ~ 4 的整数，默认 4。详见「compressLevel表 说明表」
	  */
	compressLevel?: number
	/** 调用成功的回调函数*/
	success?: compressImageSuccessCb
	/** 调用失败的回调函数 */
	fail?: compressImageFailCb
	/** 调用结束的回调函数（调用成功、失败都会执行） */
	complete?: compressImageSuccessCb | compressImageFailCb
}
interface chooseVideoOptions {
	/**
	  * album 从相册选视频，camera 使用相机拍摄，默认为：
	  */
	sourceType?: string[]
	/**
	  * 是否压缩所选的视频源文件，默认值为true，需要压缩
	  */
	compressed?: boolean
	/**
	  * 拍摄视频最长拍摄时间，单位秒。最长支持 60 秒
	  */
	maxDuration?: number
	/** 调用成功的回调函数*/
	success?: chooseVideoSuccessCb
	/** 调用失败的回调函数 */
	fail?: chooseVideoFailCb
	/** 调用结束的回调函数（调用成功、失败都会执行） */
	complete?: chooseVideoSuccessCb | chooseVideoFailCb
}
interface saveVideoToPhotosAlbumOptions {
	/**
	  * 视频文件路径，可以是临时文件路径也可以是永久文件路径，不支持网络图片路径
	  */
	filePath: string
	/** 调用成功的回调函数*/
	success?: saveVideoToPhotosAlbumSuccessCb
	/** 调用失败的回调函数 */
	fail?: saveVideoToPhotosAlbumFailCb
	/** 调用结束的回调函数（调用成功、失败都会执行） */
	complete?: saveVideoToPhotosAlbumSuccessCb | saveVideoToPhotosAlbumFailCb
}
interface uploadFileOptions {
	/**
	  * 开发者服务器地址
	  */
	url: string
	/**
	  * 要上传文件资源的本地定位符
	  */
	filePath: string
	/**
	  * 文件名，即对应的 key, 开发者在服务器端通过这个 key 可以获取到文件二进制内容
	  */
	fileName: string
	/**
	  * 文件类型，image / video / audio
	  */
	fileType: string
	/**
	  * HTTP 请求 Header
	  */
	header?: _PlainObject
	/**
	  * HTTP 请求中其他额外的 form 数据
	  */
	formData?: _PlainObject
	/** 调用成功的回调函数*/
	success?: uploadFileSuccessCb
	/** 调用失败的回调函数 */
	fail?: uploadFileFailCb
	/** 调用结束的回调函数（调用成功、失败都会执行） */
	complete?: uploadFileSuccessCb | uploadFileFailCb
}
interface downloadFileOptions {
	/**
	  * 下载文件地址
	  */
	url: string
	/**
	  * HTTP 请求 Header
	  */
	header?: _PlainObject
	/** 调用成功的回调函数*/
	success?: downloadFileSuccessCb
	/** 调用失败的回调函数 */
	fail?: downloadFileFailCb
	/** 调用结束的回调函数（调用成功、失败都会执行） */
	complete?: downloadFileSuccessCb | downloadFileFailCb
}
interface sendMtopOptions {
	/**
	  * 请求的 Mtop API 名称
	  */
	api: string
	/**
	  * API 版本号
	  */
	v?: string
	/**
	  * 接口是否需要登录，请根据服务端 API 是否要求登录来决定
	  */
	needLogin?: boolean
	/**
	  * 接口业务参数，
	  */
	data?: _PlainObject
	/** 调用成功的回调函数*/
	success?: sendMtopSuccessCb
	/** 调用失败的回调函数 */
	fail?: sendMtopFailCb
	/** 调用结束的回调函数（调用成功、失败都会执行） */
	complete?: sendMtopSuccessCb | sendMtopFailCb
}
interface httpRequestOptions {
	/**
	  * 目标服务器url
	  */
	url: string
	/**
	  * 默认GET，目前支持GET，POST
	  */
	method?: string
	/**
	  * 设置请求的 HTTP 头，默认 {'Content-Type': 'application/x-www-form-urlencoded'}
	  */
	headers?: _PlainObject
	/**
	  * 请求参数
	  */
	data?: _PlainObject | string
	/**
	  * 期望返回的数据格式，默认json，支持json，text
	  */
	dataType?: string
	/** 调用成功的回调函数*/
	success?: httpRequestSuccessCb
	/** 调用失败的回调函数 */
	fail?: httpRequestFailCb
	/** 调用结束的回调函数（调用成功、失败都会执行） */
	complete?: httpRequestSuccessCb | httpRequestFailCb
}

interface sendSocketMessageOptions {
	/**
	  * 需要发送的内容：普通的文本内容 String 或者经 base64 编码后的 String
	  */
	data: string | ArrayBuffer
	/**
	  * 如果需要发送二进制数据，需要将入参数据经 base64 编码成 String 后赋值 
	  */
	isBuffer?: boolean
	/** 调用成功的回调函数*/
	success?: sendSocketMessageSuccessCb
	/** 调用失败的回调函数 */
	fail?: sendSocketMessageFailCb
	/** 调用结束的回调函数（调用成功、失败都会执行） */
	complete?: sendSocketMessageSuccessCb | sendSocketMessageFailCb
}
interface closeSocketOptions {
	/** 调用成功的回调函数*/
	success?: closeSocketSuccessCb
	/** 调用失败的回调函数 */
	fail?: closeSocketFailCb
	/** 调用结束的回调函数（调用成功、失败都会执行） */
	complete?: closeSocketSuccessCb | closeSocketFailCb
}
interface getTBCodeOptions {
	/** 调用成功的回调函数*/
	success?: getTBCodeSuccessCb
	/** 调用失败的回调函数 */
	fail?: getTBCodeFailCb
	/** 调用结束的回调函数（调用成功、失败都会执行） */
	complete?: getTBCodeSuccessCb | getTBCodeFailCb
}
interface getTBSessionInfoOptions {
	/** 调用成功的回调函数*/
	success?: getTBSessionInfoSuccessCb
	/** 调用失败的回调函数 */
	fail?: getTBSessionInfoFailCb
	/** 调用结束的回调函数（调用成功、失败都会执行） */
	complete?: getTBSessionInfoSuccessCb | getTBSessionInfoFailCb
}
interface setTBSessionInfoOptions {
	/**
	  * 会话信息
	  */
	sessionInfo: _PlainObject
	/** 调用成功的回调函数*/
	success?: setTBSessionInfoSuccessCb
	/** 调用失败的回调函数 */
	fail?: setTBSessionInfoFailCb
	/** 调用结束的回调函数（调用成功、失败都会执行） */
	complete?: setTBSessionInfoSuccessCb | setTBSessionInfoFailCb
}
interface tradePayOptions {
	/**
	  * 接入App支付时传入此参数，完整的支付参数拼接成的字符串，从服务端获取
	  */
	orderStr?: string
	/** 调用成功的回调函数*/
	success?: tradePaySuccessCb
	/** 调用失败的回调函数 */
	fail?: tradePayFailCb
	/** 调用结束的回调函数（调用成功、失败都会执行） */
	complete?: tradePaySuccessCb | tradePayFailCb
}
interface getAuthUserInfoOptions {
	/** 调用成功的回调函数*/
	success?: getAuthUserInfoSuccessCb
	/** 调用失败的回调函数 */
	fail?: getAuthUserInfoFailCb
	/** 调用结束的回调函数（调用成功、失败都会执行） */
	complete?: getAuthUserInfoSuccessCb | getAuthUserInfoFailCb
}
interface shareTinyAppMsgOptions {
	/**
	  * 自定义分享标题
	  */
	title: string
	/**
	  * 自定义分享描述。由于分享到微博只支持最大长度 140 个字，因此建议长度不要超过该限制。
	  */
	desc?: string
	/**
	  * 自定义分享页面的路径，path中的自定义参数可在生命周期的onLoad方法中获取（参数传递遵循http get的传参规则）
	  */
	path: string
	/**
	  * 自定义文案，最多28个字符
	  */
	content?: string
	/**
	  * 自定义分享图片
	  */
	imageUrl?: string
	/**
	  * 自定义分享二维码的背景图，建议大小750*1350
	  */
	bgImgUrl?: string
	/** 调用成功的回调函数*/
	success?: shareTinyAppMsgSuccessCb
	/** 调用失败的回调函数 */
	fail?: shareTinyAppMsgFailCb
	/** 调用结束的回调函数（调用成功、失败都会执行） */
	complete?: shareTinyAppMsgSuccessCb | shareTinyAppMsgFailCb
}
interface setShareAppMessageOptions {
	/**
	  * 自定义分享标题
	  */
	title: string
	/**
	  * 自定义分享描述。由于分享到微博只支持最大长度 140 个字，因此建议长度不要超过该限制。
	  */
	desc?: string
	/**
	  * 自定义分享图片
	  */
	imageUrl?: string
	/** 调用成功的回调函数*/
	success?: setShareAppMessageSuccessCb
	/** 调用失败的回调函数 */
	fail?: setShareAppMessageFailCb
	/** 调用结束的回调函数（调用成功、失败都会执行） */
	complete?: setShareAppMessageSuccessCb | setShareAppMessageFailCb
}
interface pageScrollToOptions {
	/** 调用成功的回调函数*/
	success?: pageScrollToSuccessCb
	/** 调用失败的回调函数 */
	fail?: pageScrollToFailCb
	/** 调用结束的回调函数（调用成功、失败都会执行） */
	complete?: pageScrollToSuccessCb | pageScrollToFailCb
}
interface createAnimationOptions {
	/**
	  * 动画的持续时间，单位 ms，默认值 400
	  */
	duration?: number
	/**
	  * 定义动画的效果，默认值"linear"，有效值："linear","ease","ease-in","ease-in-out","ease-out","step-start","step-end"
	  */
	timeFunction?: string
	/**
	  * 动画延迟时间，单位 ms，默认值 0
	  */
	delay?: number
	/**
	  * 设置transform-origin，默认值 "50% 50% 0"
	  */
	transformOrigin?: string
	/** 调用成功的回调函数*/
	success?: createAnimationSuccessCb
	/** 调用失败的回调函数 */
	fail?: createAnimationFailCb
	/** 调用结束的回调函数（调用成功、失败都会执行） */
	complete?: createAnimationSuccessCb | createAnimationFailCb
}
interface datePickerOptions {
	/**
	  * 初始选择的日期时间，默认当前时间
	  */
	currentDate?: string
	/**
	  * 最小日期时间
	  */
	startDate?: string
	/**
	  * 最大日期时间
	  */
	endDate?: string
	/** 调用成功的回调函数*/
	success?: datePickerSuccessCb
	/** 调用失败的回调函数 */
	fail?: datePickerFailCb
	/** 调用结束的回调函数（调用成功、失败都会执行） */
	complete?: datePickerSuccessCb | datePickerFailCb
}
interface alertOptions {
	/**
	  * alert框的标题
	  */
	title?: string
	/**
	  * alert框的内容
	  */
	content?: string
	/**
	  * 按钮文字，默认确定
	  */
	buttonText?: string
	/** 调用成功的回调函数*/
	success?: alertSuccessCb
	/** 调用失败的回调函数 */
	fail?: alertFailCb
	/** 调用结束的回调函数（调用成功、失败都会执行） */
	complete?: alertSuccessCb | alertFailCb
}
interface confirmOptions {
	/**
	  * confirm框的标题
	  */
	title?: string
	/**
	  * confirm框的内容
	  */
	content?: string
	/**
	  * 确认按钮文字，默认‘确定’
	  */
	confirmButtonText?: string
	/**
	  * 确认按钮文字，默认‘取消’
	  */
	cancelButtonText?: string
	/** 调用成功的回调函数*/
	success?: confirmSuccessCb
	/** 调用失败的回调函数 */
	fail?: confirmFailCb
	/** 调用结束的回调函数（调用成功、失败都会执行） */
	complete?: confirmSuccessCb | confirmFailCb
}
interface promptOptions {
	/**
	  * prompt框标题
	  */
	title?: string
	/**
	  * prompt框文本，默认‘请输入内容’
	  */
	message: string
	/**
	  * 输入框内的提示文案
	  */
	placeholder?: string
	/**
	  * message对齐方式，可用枚举left/center/right
	  */
	align?: string
	/**
	  * 确认按钮文字，默认‘确定’
	  */
	okButtonText?: string
	/**
	  * 确认按钮文字，默认‘取消’
	  */
	cancelButtonText?: string
	/** 调用成功的回调函数*/
	success?: promptSuccessCb
	/** 调用失败的回调函数 */
	fail?: promptFailCb
	/** 调用结束的回调函数（调用成功、失败都会执行） */
	complete?: promptSuccessCb | promptFailCb
}
interface showToastOptions {
	/**
	  * 文字内容
	  */
	content?: string
	/**
	  * 显示时长，单位为 ms，默认 2000
	  */
	duration?: number
	/** 调用成功的回调函数*/
	success?: showToastSuccessCb
	/** 调用失败的回调函数 */
	fail?: showToastFailCb
	/** 调用结束的回调函数（调用成功、失败都会执行） */
	complete?: showToastSuccessCb | showToastFailCb
}
interface hideToastOptions {
	/** 调用成功的回调函数*/
	success?: hideToastSuccessCb
	/** 调用失败的回调函数 */
	fail?: hideToastFailCb
	/** 调用结束的回调函数（调用成功、失败都会执行） */
	complete?: hideToastSuccessCb | hideToastFailCb
}
interface showLoadingOptions {
	/**
	  * loading的文字内容
	  */
	content?: string;
	/**
	 * 是否显示透明蒙层，防止触摸穿透
	 */
	mask: boolean;
	/**
	  * 延迟显示，单位 ms，默认 0。如果在此时间之前调用了 my.hideLoading 则不会显示
	  */
	delay?: number
	/** 调用成功的回调函数*/
	success?: showLoadingSuccessCb
	/** 调用失败的回调函数 */
	fail?: showLoadingFailCb
	/** 调用结束的回调函数（调用成功、失败都会执行） */
	complete?: showLoadingSuccessCb | showLoadingFailCb
}
interface hideLoadingOptions {
	/** 调用成功的回调函数*/
	success?: hideLoadingSuccessCb
	/** 调用失败的回调函数 */
	fail?: hideLoadingFailCb
	/** 调用结束的回调函数（调用成功、失败都会执行） */
	complete?: hideLoadingSuccessCb | hideLoadingFailCb
}
interface showActionSheetOptions {
	/**
	  * 菜单标题
	  */
	title?: string
	/**
	  * 菜单按钮文字数组
	  */
	items: string[]
	/**
	  * 取消按钮文案。默认为‘取消’。注：Android平台此字段无效，不会显示取消按钮。
	  */
	cancelButtonText?: string
	/**
	  * （iOS特殊处理）指定按钮的索引号，从0开始，使用场景：需要删除或清除数据等类似场景，默认红色
	  */
	destructiveBtnIndex: number
	/**
	  * 需飘红选项的数组，数组内部对象字段见下表
	  */
	badges?: _PlainObject[]
	/** 调用成功的回调函数*/
	success?: showActionSheetSuccessCb
	/** 调用失败的回调函数 */
	fail?: showActionSheetFailCb
	/** 调用结束的回调函数（调用成功、失败都会执行） */
	complete?: showActionSheetSuccessCb | showActionSheetFailCb
}
interface hideKeyboardOptions {
	/** 调用成功的回调函数*/
	success?: hideKeyboardSuccessCb
	/** 调用失败的回调函数 */
	fail?: hideKeyboardFailCb
	/** 调用结束的回调函数（调用成功、失败都会执行） */
	complete?: hideKeyboardSuccessCb | hideKeyboardFailCb
}
interface navigateToOptions {
	/**
	  * 需要跳转的应用内非 tabBar 的目标页面路径 ,路径后可以带参数。参数规则如下：路径与参数之间使用
	  */
	url: string
	/** 调用成功的回调函数*/
	success?: navigateToSuccessCb
	/** 调用失败的回调函数 */
	fail?: navigateToFailCb
	/** 调用结束的回调函数（调用成功、失败都会执行） */
	complete?: navigateToSuccessCb | navigateToFailCb
}
interface redirectToOptions {
	/**
	  * 需要跳转的应用内非 tabBar 的目标页面路径 ,路径后可以带参数。参数规则如下：路径与参数之间使用
	  */
	url: string
	/** 调用成功的回调函数*/
	success?: redirectToSuccessCb
	/** 调用失败的回调函数 */
	fail?: redirectToFailCb
	/** 调用结束的回调函数（调用成功、失败都会执行） */
	complete?: redirectToSuccessCb | redirectToFailCb
}
interface navigateBackOptions {
	/** 调用成功的回调函数*/
	success?: navigateBackSuccessCb
	/** 调用失败的回调函数 */
	fail?: navigateBackFailCb
	/** 调用结束的回调函数（调用成功、失败都会执行） */
	complete?: navigateBackSuccessCb | navigateBackFailCb
}
interface setNavigationBarOptions {
	/**
	  * 导航栏标题
	  */
	title?: string
	/**
	  * 图片连接地址，必须是https，请使用3x高清图片。若设置了image则title参数失效
	  */
	image?: string
	/**
	  * 导航栏背景色，支持十六进制颜色值
	  */
	backgroundColor?: string
	/**
	  * 是否重置导航栏为 App 默认配色，默认 false
	  */
	reset?: boolean
	/** 调用成功的回调函数*/
	success?: setNavigationBarSuccessCb
	/** 调用失败的回调函数 */
	fail?: setNavigationBarFailCb
	/** 调用结束的回调函数（调用成功、失败都会执行） */
	complete?: setNavigationBarSuccessCb | setNavigationBarFailCb
}
interface getNavigationBarHeightOptions {
	/** 调用成功的回调函数*/
	success?: getNavigationBarHeightSuccessCb
	/** 调用失败的回调函数 */
	fail?: getNavigationBarHeightFailCb
	/** 调用结束的回调函数（调用成功、失败都会执行） */
	complete?: getNavigationBarHeightSuccessCb | getNavigationBarHeightFailCb
}
interface getStatusBarHeightOptions {
	/** 调用成功的回调函数*/
	success?: getStatusBarHeightSuccessCb
	/** 调用失败的回调函数 */
	fail?: getStatusBarHeightFailCb
	/** 调用结束的回调函数（调用成功、失败都会执行） */
	complete?: getStatusBarHeightSuccessCb | getStatusBarHeightFailCb
}
interface setBackgroundImageOptions {
	/**
	  * 背景颜色
	  */
	color?: string
	/**
	  * 图片地址
	  */
	imgUrl?: string
	/** 调用成功的回调函数*/
	success?: setBackgroundImageSuccessCb
	/** 调用失败的回调函数 */
	fail?: setBackgroundImageFailCb
	/** 调用结束的回调函数（调用成功、失败都会执行） */
	complete?: setBackgroundImageSuccessCb | setBackgroundImageFailCb
}
interface removeBackgroundImageOptions {
	/** 调用成功的回调函数*/
	success?: removeBackgroundImageSuccessCb
	/** 调用失败的回调函数 */
	fail?: removeBackgroundImageFailCb
	/** 调用结束的回调函数（调用成功、失败都会执行） */
	complete?: removeBackgroundImageSuccessCb | removeBackgroundImageFailCb
}
interface setViewTopOptions {
	/**
	  * 取值：
	  */
	position: string | number
	/**
	  * 是否有动画
	  */
	animated: boolean
	/** 调用成功的回调函数*/
	success?: setViewTopSuccessCb
	/** 调用失败的回调函数 */
	fail?: setViewTopFailCb
	/** 调用结束的回调函数（调用成功、失败都会执行） */
	complete?: setViewTopSuccessCb | setViewTopFailCb
}
interface setCanPullDownOptions {
	/**
	  * 是否可以下拉
	  */
	canPullDown: boolean
	/** 调用成功的回调函数*/
	success?: setCanPullDownSuccessCb
	/** 调用失败的回调函数 */
	fail?: setCanPullDownFailCb
	/** 调用结束的回调函数（调用成功、失败都会执行） */
	complete?: setCanPullDownSuccessCb | setCanPullDownFailCb
}
interface showSkuOptions {
	/**
	  * 商品ID
	  */
	itemId: string
	/**
	  * 取值： 
	  */
	sourceType: number
	/** 调用成功的回调函数*/
	success?: showSkuSuccessCb
	/** 调用失败的回调函数 */
	fail?: showSkuFailCb
	/** 调用结束的回调函数（调用成功、失败都会执行） */
	complete?: showSkuSuccessCb | showSkuFailCb
}
interface hideSkuOptions {
	/** 调用成功的回调函数*/
	success?: hideSkuSuccessCb
	/** 调用失败的回调函数 */
	fail?: hideSkuFailCb
	/** 调用结束的回调函数（调用成功、失败都会执行） */
	complete?: hideSkuSuccessCb | hideSkuFailCb
}
interface switchTabOptions {
	/**
	  * 跳转的 tabBar 页面的路径（需在 app.json 的 tabBar 字段定义的页面）。注意：路径后不能带参数
	  */
	url: string
	/** 调用成功的回调函数*/
	success?: switchTabSuccessCb
	/** 调用失败的回调函数 */
	fail?: switchTabFailCb
	/** 调用结束的回调函数（调用成功、失败都会执行） */
	complete?: switchTabSuccessCb | switchTabFailCb
}
interface showTabBarOptions {
	/**
	  * 是否开启动画
	  */
	animation: boolean
	/**
	  * 动画类型，取值 
	  */
	animationType?: string
	/** 调用成功的回调函数*/
	success?: showTabBarSuccessCb
	/** 调用失败的回调函数 */
	fail?: showTabBarFailCb
	/** 调用结束的回调函数（调用成功、失败都会执行） */
	complete?: showTabBarSuccessCb | showTabBarFailCb
}
interface hideTabBarOptions {
	/**
	  * 是否开启动画
	  */
	animation: boolean
	/**
	  * 动画类型，取值 
	  */
	animationType?: string
	/** 调用成功的回调函数*/
	success?: hideTabBarSuccessCb
	/** 调用失败的回调函数 */
	fail?: hideTabBarFailCb
	/** 调用结束的回调函数（调用成功、失败都会执行） */
	complete?: hideTabBarSuccessCb | hideTabBarFailCb
}
interface setTabBarStyleOptions {
	/**
	  * tab 上的文字默认颜色，HexColor
	  */
	color?: string
	/**
	  * tab 上的文字选中时的颜色，HexColor
	  */
	selectedColor?: string
	/**
	  * tab 的背景色，HexColor
	  */
	backgroundColor?: string
	/**
	  * tabBar上边框的颜色，HexColor
	  */
	borderStyle?: string
	/** 调用成功的回调函数*/
	success?: setTabBarStyleSuccessCb
	/** 调用失败的回调函数 */
	fail?: setTabBarStyleFailCb
	/** 调用结束的回调函数（调用成功、失败都会执行） */
	complete?: setTabBarStyleSuccessCb | setTabBarStyleFailCb
}
interface setTabBarItemOptions {
	/**
	  * tabBar 的哪一项，从左边算起，从0开始算起
	  */
	index: number
	/**
	  * tab 上的按钮文字
	  */
	text?: string
	/**
	  * 图片路径
	  */
	iconPath?: string
	/**
	  * 选中时的图片路径
	  */
	selectedIconPath?: string
	/** 调用成功的回调函数*/
	success?: setTabBarItemSuccessCb
	/** 调用失败的回调函数 */
	fail?: setTabBarItemFailCb
	/** 调用结束的回调函数（调用成功、失败都会执行） */
	complete?: setTabBarItemSuccessCb | setTabBarItemFailCb
}
interface setTabBarBadgeOptions {
	/**
	  * tabBar 的哪一项，从左边算起，从0开始算起
	  */
	index: number
	/**
	  * tab 上的按钮显示的数值。超出100，显示99+
	  */
	text: string
	/** 调用成功的回调函数*/
	success?: setTabBarBadgeSuccessCb
	/** 调用失败的回调函数 */
	fail?: setTabBarBadgeFailCb
	/** 调用结束的回调函数（调用成功、失败都会执行） */
	complete?: setTabBarBadgeSuccessCb | setTabBarBadgeFailCb
}
interface removeTabBarBadgeOptions {
	/**
	  * tabBar 的哪一项，从左边算起，从0开始算起
	  */
	index: number
	/** 调用成功的回调函数*/
	success?: removeTabBarBadgeSuccessCb
	/** 调用失败的回调函数 */
	fail?: removeTabBarBadgeFailCb
	/** 调用结束的回调函数（调用成功、失败都会执行） */
	complete?: removeTabBarBadgeSuccessCb | removeTabBarBadgeFailCb
}
interface showTabBarRedDotOptions {
	/**
	  * tabBar 的哪一项，从左边算起，从0开始算起
	  */
	index: number
	/** 调用成功的回调函数*/
	success?: showTabBarRedDotSuccessCb
	/** 调用失败的回调函数 */
	fail?: showTabBarRedDotFailCb
	/** 调用结束的回调函数（调用成功、失败都会执行） */
	complete?: showTabBarRedDotSuccessCb | showTabBarRedDotFailCb
}
interface hideTabBarRedDotOptions {
	/**
	  * tabBar 的哪一项，从左边算起，从0开始算起
	  */
	index: number
	/** 调用成功的回调函数*/
	success?: hideTabBarRedDotSuccessCb
	/** 调用失败的回调函数 */
	fail?: hideTabBarRedDotFailCb
	/** 调用结束的回调函数（调用成功、失败都会执行） */
	complete?: hideTabBarRedDotSuccessCb | hideTabBarRedDotFailCb
}

type canIUseReturn = boolean
interface getSystemInfoSyncReturn {
	/**
	  * 手机型号
	  */
	model: string
	/**
	  * 设备像素比
	  */
	pixelRatio: number
	/**
	  * 窗口宽度
	  */
	windowWidth: number
	/**
	  * 窗口高度
	  */
	windowHeight: number
	/**
	  * 客户端设置的语言
	  */
	language: string
	/**
	  * 客户端版本号
	  */
	version: string
	/**
	  * 设备磁盘容量（暂不支持）
	  */
	storage: string
	/**
	  * 当前电量百分比（暂不支持）
	  */
	currentBattery: string
	/**
	  * 系统版本
	  */
	system: string
	/**
	  * 系统名：Android，iOS
	  */
	platform: string
	/**
	  * 屏幕宽度
	  */
	screenWidth: number
	/**
	  * 屏幕高度
	  */
	screenHeight: number
	/**
	  * 手机品牌
	  */
	brand: string
	/**
	  * 用户设置字体大小
	  */
	fontSizeSetting: number
	/**
	  * 当前运行的客户端
	  */
	app: string
}
interface createInnerAudioContextReturn {

	src: string

	duration: number

	play: _AnyFunction

	pause: _AnyFunction

	stop: _AnyFunction

	onPlay: _AnyFunction

	onPause: _AnyFunction

	onStop: _AnyFunction

	onError: _AnyFunction

	offPlay: _AnyFunction

	offPause: _AnyFunction

	offStop: _AnyFunction

	offError: _AnyFunction
}
interface getRecorderManagerReturn {

	start: _AnyFunction

	stop: _AnyFunction

	onStart: _AnyFunction

	onStop: _AnyFunction

	onError: _AnyFunction

	offStart: _AnyFunction

	offStop: _AnyFunction

	offError: _AnyFunction
}
interface createVideoContextReturn {

	play: _AnyFunction

	pause: _AnyFunction

	stop: _AnyFunction

	requestFullScreen: _AnyFunction

	exitFullScreen: _AnyFunction
}
interface createAnimationReturn {

	opacity: _AnyFunction

	backgroundColor: _AnyFunction

	width: _AnyFunction

	height: _AnyFunction

	top: _AnyFunction

	left: _AnyFunction

	bottom: _AnyFunction

	right: _AnyFunction

	rotate: _AnyFunction

	rotateX: _AnyFunction

	rotateY: _AnyFunction

	rotateZ: _AnyFunction

	rotate3d: _AnyFunction

	translate: _AnyFunction

	translateX: _AnyFunction

	translateY: _AnyFunction

	translateZ: _AnyFunction

	translate3d: _AnyFunction

	skew: _AnyFunction

	skewX: _AnyFunction

	skewY: _AnyFunction

	matrix: _AnyFunction

	matrix3d: _AnyFunction
}

declare namespace AliyMiniprogram {
	interface GameClubButton {
		show(): void
		hide(): void
		/** 监听游戏圈按钮点击 */
		onTap(listener: (res: any) => void): void;
		/** 移除游戏圈按钮点击监听 */
		offTap(listener: (res: any) => void): void;
		/** 回收游戏圈按钮 */
		destroy(): void;
	}

	interface AccountInfo {
		miniProgram: {
			/** 小程序 appId */
			appId: string;
			/** 当前运行环境的小程序版本号。 */
			version: string;
			/** 小程序当前运行版本 */
			envVersion: 'release' | 'trial' | 'develop';
		}
	}

	interface RewardedAd {
		/** 
		 * 加载激励视频广告
		 * fail 回调的参数为 Object，error 属性为错误码，errorMessage 属性为错误消息。
			2	广告实例无效，请检查 createRewardedAd 时传入的广告单元 ID 是否有误。	请检查 createRewardedAd 时传入的广告单元 ID 是否有误。
			3	未知错误。	请稍后重试。
			61000	广告返回空。	请检查广告单元配置是否成功或服务端疲劳度配置。
			61001	广告请求超时。	请检查网络环境是否正常。
			61002	广告请求错误。	请检查参数配置。
			61003	广告单元重复创建。	请在用户关闭广告（可以使用 onClose 来监听）之后，再调用 load 方法。
			61004	广告视图创建失败。	请检查参数配置，重新创建广告。
		 */
		load(): Promise<any>;

		/** 
		 * 显示激励视频广告
		 * fail 回调的参数为 Object，error 属性为错误码，errorMessage 属性为错误消息
			2	广告实例无效，请检查 createRewardedAd 时传入的广告单元 ID 是否有误。	请检查 createRewardedAd 时传入的广告单元 ID 是否有误。
			61101	广告状态异常。	请先调用 load 并等待加载完成
		 */
		show(): Promise<any>;

		/** 
		 * 广告加载完成
		 */
		onLoad(listener: (res: any) => void);
		/** 
		 * 监听激励广告加载错误的事件
			2	参数类型错误。请确认创建广告时传入的广告单元 ID 合法。	-
			3	未知错误。请稍后重试。	-
			61000	广告返回空。请检查广告单元配置是否成功或服务端疲劳度配置。	-
			61001	广告请求超时。请检查网络环境是否正常。	-
			61002	广告请求错误。请检查参数配置，重新创建广告。	-
			61003	广告单元重复创建。请在用户关闭广告（可以使用 onClose 来监听）之后，再调用 load 方法。	-
			61004	广告视图创建失败。请检查参数配置，重新创建广告。
		 */
		onError(listener: (res: CallBack.Fail) => void);

		/** 
		 * 关闭广告事件的监听函数 
		 * isEnded 视频是否是在用户完整观看的情况下被关闭的。
		 */
		onClose(listener: (res: { isEnded: boolean }) => void);
	}

	interface AppLaunchOptions {
		/** 启动小游戏的 query 参数 */
		query: _PlainObject;
		/** 启动小游戏的场景值 */
		scene: number;
		/**  来源信息。从另一个App 进入小游戏时返回。否则返回 {} */
		referrerInfo: {
			/** 来源App 的 appId */
			appId: string;
			/** 来源App传过来的数据 */
			extraData: _PlainObject;
		}
	}

	namespace CallBack {
		interface Fail {
			/** 错误码 */
			error?: number;
			/** 错误信息 */
			errorMessage?: string
		}
	}

	enum ReadyState {
		/** 正在连接(CONNECTING) */
		CONNECTING = 0,
		/** 已连接(OPEN) */
		OPEN = 1,
		/** 正在关闭(CLOSING) */
		CLOSING = 2,
		/** 已关闭(CLOSED) */
		CLOSED = 3
	}

	interface connectSocketOptions {
		/** 开发者服务器 wss 接口地址。注意：请尽量不要在 url 参数中传空格。若业务需要，链接中一定要包含空格，请务必把空格进行转义，否则 API 会报错 */
		url: string;
		/* 请求的参数。会将数据转换成 querystring 形式拼在 url 上 */
		data?: Object;
		/** 请求头 */
		header?: Object;
		/**	
		是否多实例。传入 true 时，API 返回 SocketTask 实例。
		注意： 基础库 2.9.1 以下，multiple 的默认值为 false；2.9.1 及以上，multiple 的默认值会优先使用 app.json 中 behavior 下的 connectSocketDefaultMultiple 字段，IDE 中默认小程序模版内 connectSocketDefaultMultiple 为 true
		 */
		multiple?: boolean;
		/** 子协议数组。会设置请求头的 sec-websocket-protocol */
		protocols?: string[];
		/** 超时时间 30000 */
		timeout?: number;
		/** 调用成功的回调函数 */
		success?: (result?: any) => void;
		/** 调用失败的回调函数 */
		/**
		 * 错误码	错误消息	解决方案
			1	未知错误。	
			2	接口参数无效。	请检查 URL 是否合法。
			3	该appId，SocketTaskID对应的WebSocket已存在。	 单实例（multiple = false）的 WebSocket 只能创建一次，多次创建会报此错。可先执行 my.closeSocket 关闭当前 WebSocket，再进行下一次的创建。
			4	无法识别的 URL 格式。	 替换 URL 链接。
			5	URL 必须以 ws 或者 wss 开头。	 替换 URL 链接。
			6	连接服务器超时。	
			7	服务器返回的https证书无效。	
			8	服务端返回协议头无效。	
			9	WebSocket请求没有指定Sec-WebSocket-Protocol请求头。	
			10	网络连接没有打开，无法发送消息。	
			11	消息发送失败。	
			20	请求url不支持ws，请使用wss。	请使用 wss 协议的 url。
		 */
		fail?: (result?: CallBack.Fail) => void;
		/** 调用结束的回调函数（调用成功、失败都会执行） */
		complete?: () => void;
	}

	interface SendData {
		/**
		需要发送的内容
		注：如需发送二进制数据，可将数据 Base64 编码后作为 data 传入，同时设置入参 isBuffer 为 true
		自支付宝 10.5.16+ 开始，data 直接支持传入 ArrayBuffer 类型，此时 isBuffer 会被忽略。IDE 上暂不支持 data 直接传入 ArrayBuffer
		 */
		data: string | ArrayBuffer;
		isBuffer?: boolean;
		/** 调用成功的回调函数 */
		success?: () => void;
		/**
		 * 调用失败的回调函数
			10	网络连接没有打开，无法发送消息。	
			请正常连接服务器后再调用 SocketTask.send 发送数据消息。可通过 SocketTask.onOpen 监听事件来判断与服务器建立正确连接。
		 */
		fail?: (result: CallBack.Fail) => void;
		/** 调用结束的回调函数（调用成功、失败都会执行） */
		complete?: () => void;
	}

	interface CloseData {
		/**  连接被关闭的状态码。只能传 1000、或 3000～4999 之间 */
		code: number;
		/** 连接被关闭的原因。 */
		reason?: string;
		/** 调用成功的回调函数 */
		success?: () => void;
		/**
		 * 调用失败的回调函数
			10	网络连接没有打开，无法发送消息。	
			请正常连接服务器后再调用 SocketTask.send 发送数据消息。可通过 SocketTask.onOpen 监听事件来判断与服务器建立正确连接。
		 */
		fail?: (result: CallBack.Fail) => void;
		/** 调用结束的回调函数（调用成功、失败都会执行） */
		complete?: () => void;
	}

	interface OnOpenData {
		/** Socket 任务 ID */
		socketTaskID: string;
		/** 连接成功的 HTTP 响应 Header。支付宝 10.3.80+，IDE 3.8.3+ 开始支持 */
		header?: _PlainObject;
		/** 接收到的数据 */
		data: { socketTaskID: string, header: _PlainObject };
	}

	interface OnMessageData {
		/** 接收到的数据 */
		message: string;
		/** isBuffer */
		isBuffer: boolean;
		data: { data: string, isBuffer: boolean }
	}

	interface SocketTask {
		readyState: ReadyState;
		/** 需要先使用 my.connectSocket 建立连接，在 SocketTask.onOpen 回调之后再发送数据。 */
		send(res: SendData): void;
		/** 关闭 WebSocket 连接。 */
		close(res: CloseData): void;
		/** WebSocket 接收到服务器的消息事件的监听函数 */
		onOpen(callback: (res: OnOpenData) => void): void;
		/** WebSocket 接收到服务器的消息事件的监听函数。 */
		onMessage(callback: (res: OnMessageData) => void): void;
		/** WebSocket 连接关闭事件的监听函数。 */
		onClose(callback: (res: { code: number, reason: string, data: { code: number, reason: string } }) => void): void;
		/** 
		 * 监听 WebSocket 错误事件。
		 * 错误码。注：IDE 没有错误码和错误信息，请以真机为准
			6	Timed out connecting to server.（请求超时。若请求需要时间长，可适当设置超时时间 timeout）
			8	Invalid Sec-WebSocket-Accept response.（请检查 url 是否指向一个有效的 websocket 服务。）
			50	未能完成该操作。网络已关闭（请检查网络环境是否正常，服务器是否稳定，外网下是否能正常请求。）
			65	未能完成该操作。无到主机的路由（请检查域名是否正确，网络环境是否正常。）
		 */
		onError(callback: (res: { data: CallBack.Fail }) => void): void;
	}
}

/**
 * 接口说明
 */
interface My {
	/**
	  * [官方文档](https://developer.taobao.com/api/data/file.html#my-savefile)
	  *
	  * 保存文件到本地（本地文件大小总容量限制：10M）
	  */
	saveFile(
		options: saveFileOptions
	): void
	/**
	  * [官方文档](https://developer.taobao.com/api/data/file.html#my-getfileinfo)
	  */
	getFileInfo(
		options: getFileInfoOptions
	): void
	/**
	  * [官方文档](https://developer.taobao.com/api/data/file.html#my-getsavedfileinfo)
	  *
	  * 获取保存的文件信息
	  */
	getSavedFileInfo(
		options: getSavedFileInfoOptions
	): void
	/**
	  * [官方文档](https://developer.taobao.com/api/data/file.html#my-getsavedfilelist)
	  *
	  * 获取保存的所有文件
	  */
	getSavedFileList(
		options?: getSavedFileListOptions
	): void
	/**
	  * [官方文档](https://developer.taobao.com/api/data/file.html#my-removesavedfile)
	  *
	  * 删除某个保存的文件
	  */
	removeSavedFile(
		options: removeSavedFileOptions
	): void
	/**
	  * [官方文档](https://developer.taobao.com/api/data/storage.html#my-setstorage)
	  *
	  * 将数据存储在本地缓存中指定的 key 中，会覆盖掉原来该 key 对应的数据。目前只支持存储字符串，可以使用JSON.stringify序列化对象。
	  */
	setStorage(
		options: setStorageOptions
	): void
	/**
	  * [官方文档](https://developer.taobao.com/api/data/storage.html#my-setstoragesync)
	  *
	  * 同步将数据存储在本地缓存中指定的 key 中。
	  */
	setStorageSync(
		options: setStorageSyncOptions
	): void
	/**
	  * [官方文档](https://developer.taobao.com/api/data/storage.html#my-getstorage)
	  *
	  * 获取缓存数据。
	  */
	getStorage(
		options: getStorageOptions
	): void
	/**
	  * [官方文档](https://developer.taobao.com/api/data/storage.html#my-getstoragesync)
	  *
	  * 同步获取缓存数据。
	  */
	getStorageSync(
		options: getStorageSyncOptions
	): void
	/**
	  * [官方文档](https://developer.taobao.com/api/data/storage.html#my-removestorage)
	  *
	  * 删除缓存数据。
	  */
	removeStorage(
		options: removeStorageOptions
	): void
	/**
	  * [官方文档](https://developer.taobao.com/api/data/storage.html#my-removestoragesync)
	  *
	  * 同步删除缓存数据。
	  */
	removeStorageSync(
		options: removeStorageSyncOptions
	): void
	/**
	  * [官方文档](https://developer.taobao.com/api/data/storage.html#my-getstorageinfo)
	  *
	  * 异步获取当前storage的相关信息。
	  */
	getStorageInfo(
		options?: getStorageInfoOptions
	): void
	/**
	  * [官方文档](https://developer.taobao.com/api/device/can-i-use.html#my-caniuse)
	  *
	  * 判断当前的 API 在当前版本是否支持。
	  */
	canIUse(
		/**
	* API 名称，例如 'navigateTo'
	*/
		api: string,
	): canIUseReturn
	/**
	  * [官方文档](https://developer.taobao.com/api/device/clipboard.html#my-getclipboard)
	  *
	  * 获取剪贴板数据。
	  */
	getClipboard(
		options?: getClipboardOptions
	): void
	/**
	  * [官方文档](https://developer.taobao.com/api/device/clipboard.html#my-setclipboard)
	  *
	  * 设置剪贴板数据。
	  */
	setClipboard(
		options: setClipboardOptions
	): void
	/**
	  * [官方文档](https://developer.taobao.com/api/device/make-call.html#my-makephonecall)
	  *
	  * 拨打电话。
	  */
	makePhoneCall(
		options: makePhoneCallOptions
	): void
	/**
	  * [官方文档](https://developer.taobao.com/api/device/network-status.html#my-getnetworktype)
	  *
	  * 获取当前网络状态。
	  */
	getNetworkType(
		options?: getNetworkTypeOptions
	): void
	/**
	  * [官方文档](https://developer.taobao.com/api/device/network-status.html#my-onnetworkstatuschange)
	  *
	  * 开始网络状态变化的监听
	  */
	onNetworkStatusChange(
		callback: onNetworkStatusChangeCallback
	): void
	/**
	  * [官方文档](https://developer.taobao.com/api/device/network-status.html#my-offnetworkstatuschange)
	  *
	  * 取消网络状态变化的监听
	  */
	offNetworkStatusChange(
		callback: offNetworkStatusChangeCallback
	): void
	/**
	  * [官方文档](https://developer.taobao.com/api/device/screen-brightness.html#my-setkeepscreenon)
	  *
	  * 设置是否保持屏幕长亮状态。仅在当前应用生效，离开后失效。
	  */
	setKeepScreenOn(
		options: setKeepScreenOnOptions
	): void
	/**
	  * [官方文档](https://developer.taobao.com/api/device/screen-brightness.html#my-getscreenbrightness)
	  *
	  * 获取屏幕亮度
	  */
	getScreenBrightness(
		options?: getScreenBrightnessOptions
	): void
	/**
	  * [官方文档](https://developer.taobao.com/api/device/screen-brightness.html#my-setscreenbrightness)
	  *
	  * 设置屏幕亮度
	  */
	setScreenBrightness(
		options: setScreenBrightnessOptions
	): void
	/**
	  * [官方文档](https://developer.taobao.com/api/device/sdk-version.html#my-sdkversion)
	  *
	  * 获取基础库版本号。
	  */
	SDKVersion: string,
	/**
	  * [官方文档](https://developer.taobao.com/api/device/shake.html#my-watchshake)
	  *
	  * 摇一摇功能。每次调用 API，在摇一摇手机后触发回调，如需再次监听需要再次调用这个 API。
	  */
	watchShake(
		options?: watchShakeOptions
	): void
	/**
	  * [官方文档](https://developer.taobao.com/api/device/system-info.html#my-getsysteminfo)
	  *
	  * 获取系统信息。
	  */
	getSystemInfo(
		options?: getSystemInfoOptions
	): void
	/**
	  * [官方文档](https://developer.taobao.com/api/device/system-info.html#my-getsysteminfosync)
	  *
	  * 返回值同 getSystemInfo success 回调参数
	  */
	getSystemInfoSync(
	): getSystemInfoSyncReturn
	/**
	  * [官方文档](https://developer.taobao.com/api/device/ui-contact.html#my-choosephonecontact)
	  *
	  * 选择本地系统通信录中某个联系人的电话。
	  */
	choosePhoneContact(
		options?: choosePhoneContactOptions
	): void
	/**
	  * [官方文档](https://developer.taobao.com/api/device/vibrate.html#my-vibrate)
	  *
	  * 调用震动功能。
	  */
	vibrate(
		options?: vibrateOptions
	): void
	/**
	  * [官方文档](https://developer.taobao.com/api/location/location.html#my-getlocation)
	  *
	  * 获取用户当前的地理位置信息。
	  */
	getLocation(
		options?: getLocationOptions
	): void
	/**
	  * [官方文档](https://developer.taobao.com/api/location/ui-city.html#my-choosecity)
	  *
	  * 打开城市选择列表。
	  */
	chooseCity(
		options?: chooseCityOptions
	): void
	/**
	  * [官方文档](https://developer.taobao.com/api/media/audio.html#my-createinneraudiocontext)
	  *
	  * 创建并返回内部 audio 上下文 innerAudioContext 对象。
	  */
	createInnerAudioContext(
		options: createInnerAudioContextOptions
	): createInnerAudioContextReturn
	/**
	  * [官方文档](https://developer.taobao.com/api/media/image.html#my-chooseimage)
	  *
	  * 从本地相册选择图片或使用相机拍照。
	  */
	chooseImage(
		options?: chooseImageOptions
	): void
	/**
	  * [官方文档](https://developer.taobao.com/api/media/image.html#my-previewimage)
	  *
	  * 预览图片。
	  */
	previewImage(
		options: previewImageOptions
	): void
	/**
	  * [官方文档](https://developer.taobao.com/api/media/image.html#my-getimageinfo)
	  *
	  * 获取图片信息。
	  */
	getImageInfo(
		options: getImageInfoOptions
	): void
	/**
	  * [官方文档](https://developer.taobao.com/api/media/image.html#my-saveimage)
	  *
	  * 保存图片到系统相册。
	  */
	saveImage(
		options: saveImageOptions
	): void
	/**
	  * [官方文档](https://developer.taobao.com/api/media/image.html#my-compressimage)
	  *
	  * 压缩图片。
	  */
	compressImage(
		options: compressImageOptions
	): void
	/**
	  * [官方文档](https://developer.taobao.com/api/media/recorder.html#my-getrecordermanager)
	  *
	  * 获取全局唯一的录音管理器recorderManager。
	  */
	getRecorderManager(
	): getRecorderManagerReturn
	/**
	  * [官方文档](https://developer.taobao.com/api/media/video.html#my-createvideocontext)
	  *
	  * 创建并返回 video 上下文 videoContext 对象。
	  */
	createVideoContext(

		id?: string,
	): createVideoContextReturn
	/**
	  * [官方文档](https://developer.taobao.com/api/media/video.html#my-choosevideo)
	  *
	  * 拍摄视频或从手机相册中选视频，返回视频的临时文件路径。
	  */
	chooseVideo(
		options?: chooseVideoOptions
	): void
	/**
	  * [官方文档](https://developer.taobao.com/api/media/video.html#my-savevideotophotosalbum)
	  *
	  * 保存视频到系统相册。
	  */
	saveVideoToPhotosAlbum(
		options: saveVideoToPhotosAlbumOptions
	): void
	/**
	  * [官方文档](https://developer.taobao.com/api/network/file.html#my-uploadfile)
	  *
	  * 上传本地资源到开发者服务器。
	  */
	uploadFile(
		options: uploadFileOptions
	): void
	/**
	  * [官方文档](https://developer.taobao.com/api/network/file.html#my-downloadfile)
	  *
	  * 下载文件资源到本地。
	  */
	downloadFile(
		options: downloadFileOptions
	): void
	/**
	  * [官方文档](https://developer.taobao.com/api/network/mtop.html#my-sendmtop)
	  *
	  * 提供调用 Mtop 接口的能力
	  */
	sendMtop(
		options: sendMtopOptions
	): void
	/**
	  * [官方文档](https://developer.taobao.com/api/network/network.html#my-httprequest)
	  *
	  * 向指定服务器发起一个跨域 http 请求。
	  */
	httpRequest(
		options: httpRequestOptions
	): void
	/**
	  * [官方文档](https://developer.taobao.com/api/network/websocket.html#my-connectsocket)
	  *
	  * 创建一个 [object Object] 的连接；同时只能保留一个 WebSocket 连接，如果当前已存在 WebSocket 连接，会自动关闭该连接，并重新创建一个新的 WebSocket 连接。
	  */
	connectSocket(
		options: AliyMiniprogram.connectSocketOptions
	): AliyMiniprogram.SocketTask
	/**
	  * [官方文档](https://developer.taobao.com/api/network/websocket.html#my-onsocketopen)
	  *
	  * 监听 WebSocket 连接打开事件。
	  */
	onSocketOpen(
		callback: onSocketOpenCallback
	): void
	/**
	  * [官方文档](https://developer.taobao.com/api/network/websocket.html#my-offsocketopen)
	  *
	  * 取消监听 WebSocket 连接打开事件。
	  */
	offSocketOpen(
		callback: offSocketOpenCallback
	): void
	/**
	  * [官方文档](https://developer.taobao.com/api/network/websocket.html#my-onsocketerror)
	  *
	  * 监听 WebSocket 错误。
	  */
	onSocketError(
		callback: onSocketErrorCallback
	): void
	/**
	  * [官方文档](https://developer.taobao.com/api/network/websocket.html#my-offsocketerror)
	  *
	  * 取消监听 WebSocket 错误。
	  */
	offSocketError(
		callback: offSocketErrorCallback
	): void
	/**
	  * [官方文档](https://developer.taobao.com/api/network/websocket.html#my-sendsocketmessage)
	  *
	  * 通过 WebSocket 连接发送数据，需要先使用 [object Object] 发起建连，并在 [object Object] 回调之后再发送数据。
	  */
	sendSocketMessage(
		options: sendSocketMessageOptions
	): void
	/**
	  * [官方文档](https://developer.taobao.com/api/network/websocket.html#my-onsocketmessage)
	  *
	  * 监听 WebSocket 接受到服务器的消息事件。
	  */
	onSocketMessage(
		callback: onSocketMessageCallback
	): void
	/**
	  * [官方文档](https://developer.taobao.com/api/network/websocket.html#my-offsocketmessage)
	  *
	  * 取消监听 WebSocket 接受到服务器的消息事件。
	  */
	offSocketMessage(
		callback: offSocketMessageCallback
	): void
	/**
	  * [官方文档](https://developer.taobao.com/api/network/websocket.html#my-closesocket)
	  *
	  * 关闭 WebSocket 连接。
	  */
	closeSocket(
		options?: closeSocketOptions
	): void
	/**
	  * [官方文档](https://developer.taobao.com/api/network/websocket.html#my-onsocketclose)
	  *
	  * 监听 WebSocket 关闭。
	  */
	onSocketClose(
		callback: onSocketCloseCallback
	): void
	/**
	  * [官方文档](https://developer.taobao.com/api/network/websocket.html#my-offsocketclose)
	  *
	  * 取消监听 WebSocket 关闭。
	  */
	offSocketClose(
		callback: offSocketCloseCallback
	): void
	/**
	  * [官方文档](https://developer.taobao.com/api/open/authentication.html#my-gettbcode)
	  *
	  * 登录授权
	  */
	getTBCode(
		options?: getTBCodeOptions
	): void
	/**
	  * [官方文档](https://developer.taobao.com/api/open/authentication.html#my-gettbsessioninfo)
	  *
	  * 获取会话信息
	  */
	getTBSessionInfo(
		options?: getTBSessionInfoOptions
	): void
	/**
	  * [官方文档](https://developer.taobao.com/api/open/authentication.html#my-settbsessioninfo)
	  *
	  * 设置会话信息
	  */
	setTBSessionInfo(
		options: setTBSessionInfoOptions
	): void
	/**
	  * [官方文档](https://developer.taobao.com/api/open/pay.html#my-tradepay)
	  */
	tradePay(
		options?: tradePayOptions
	): void
	/**
	  * [官方文档](https://developer.taobao.com/api/open/userinfo.html#my-getauthuserinfo)
	  *
	  * 客户端获取会员信息。
	  */
	getAuthUserInfo(
		options?: getAuthUserInfoOptions
	): void
	/**
	  * [官方文档](https://developer.taobao.com/api/other/report.html#my-reportanalytics)
	  *
	  * 自定义分析数据的上报接口。
	  */
	reportAnalytics(

		eventName: string,

		data: _PlainObject,
	): void
	/**
	  * [官方文档](https://developer.taobao.com/api/other/share.html#my-sharetinyappmsg)
	  *
	  * 手动唤起分享
	  */
	shareTinyAppMsg(
		options: shareTinyAppMsgOptions
	): void
	/**
	  * [官方文档](https://developer.taobao.com/api/other/share.html#my-setshareappmessage)
	  *
	  * 设置该页面的分享信息，用户点击右上角分享按钮后，使用该接口设置的信息
	  */
	setShareAppMessage(
		options: setShareAppMessageOptions
	): void
	/**
	  * [官方文档](https://developer.taobao.com/api/ui/scroll.html#my-pagescrollto)
	  *
	  * 滚动到页面的目标位置。
	  */
	pageScrollTo(
		options?: pageScrollToOptions
	): void
	/**
	  * [官方文档](https://developer.taobao.com/api/ui/ui-createAnimation.html#my-createanimation)
	  *
	  * 创建动画实例 animation。调用实例的方法来描述动画，最后通过动画实例的 export 方法将动画数据导出并传递给组件的 animation 属性。
	  */
	createAnimation(
		options?: createAnimationOptions
	): createAnimationReturn
	/**
	  * [官方文档](https://developer.taobao.com/api/ui/ui-date.html#my-datepicker)
	  *
	  * 打开日期选择列表。
	  */
	datePicker(
		options?: datePickerOptions
	): void
	/**
	  * [官方文档](https://developer.taobao.com/api/ui/ui-feedback.html#my-alert)
	  *
	  * alert 警告框。
	  */
	alert(
		options?: alertOptions
	): void
	/**
	  * [官方文档](https://developer.taobao.com/api/ui/ui-feedback.html#my-confirm)
	  *
	  * confirm 确认框。
	  */
	confirm(
		options?: confirmOptions
	): void
	/**
	  * [官方文档](https://developer.taobao.com/api/ui/ui-feedback.html#my-prompt)
	  *
	  * 用于显示可提示用户进行输入的对话框。
	  */
	prompt(
		options: promptOptions
	): void
	/**
	  * [官方文档](https://developer.taobao.com/api/ui/ui-feedback.html#my-showtoast)
	  *
	  * 显示一个弱提示，可选择多少秒之后消失。
	  */
	showToast(
		options?: showToastOptions
	): void
	/**
	  * [官方文档](https://developer.taobao.com/api/ui/ui-feedback.html#my-hidetoast)
	  *
	  * 隐藏弱提示。
	  */
	hideToast(
		options?: hideToastOptions
	): void
	/**
	  * [官方文档](https://developer.taobao.com/api/ui/ui-feedback.html#my-showloading)
	  *
	  * 显示加载提示。
	  */
	showLoading(
		options?: showLoadingOptions
	): void
	/**
	  * [官方文档](https://developer.taobao.com/api/ui/ui-feedback.html#my-hideloading)
	  *
	  * 隐藏加载提示。
	  */
	hideLoading(
		options?: hideLoadingOptions
	): void
	/**
	  * [官方文档](https://developer.taobao.com/api/ui/ui-feedback.html#my-showactionsheet)
	  *
	  * 显示操作菜单。
	  */
	showActionSheet(
		options: showActionSheetOptions
	): void
	/**
	  * [官方文档](https://developer.taobao.com/api/ui/ui-hidekeyboard.html#my-hidekeyboard)
	  *
	  * 隐藏键盘。
	  */
	hideKeyboard(
		options?: hideKeyboardOptions
	): void
	/**
	  * [官方文档](https://developer.taobao.com/api/ui/ui-navigate.html#my-navigateto)
	  *
	  * 保留当前页面，跳转到应用内的某个指定页面，可以使用 my.navigateBack 返回到原来页面。
	  */
	navigateTo(
		options: navigateToOptions
	): void
	/**
	  * [官方文档](https://developer.taobao.com/api/ui/ui-navigate.html#my-redirectto)
	  *
	  * 关闭当前页面，跳转到应用内的某个指定页面。
	  */
	redirectTo(
		options: redirectToOptions
	): void
	/**
	  * [官方文档](https://developer.taobao.com/api/ui/ui-navigate.html#my-navigateback)
	  *
	  * 关闭当前页面，返回上一级页面。
	  */
	navigateBack(
		options?: navigateBackOptions
	): void
	/**
	  * [官方文档](https://developer.taobao.com/api/ui/ui-navigate.html#my-setnavigationbar)
	  *
	  * 设置导航栏文字及样式。
	  */
	setNavigationBar(
		options?: setNavigationBarOptions
	): void
	/**
	  * [官方文档](https://developer.taobao.com/api/ui/ui-navigate.html#my-getnavigationbarheight)
	  *
	  * 获取导航栏高度。
	  */
	getNavigationBarHeight(
		options?: getNavigationBarHeightOptions
	): void
	/**
	  * [官方文档](https://developer.taobao.com/api/ui/ui-navigate.html#my-getstatusbarheight)
	  *
	  * 获取状态栏高度。
	  */
	getStatusBarHeight(
		options?: getStatusBarHeightOptions
	): void
	/**
	  * [官方文档](https://developer.taobao.com/api/ui/ui-pulldown.html#my-setbackgroundimage)
	  *
	  * 设置页面背景
	  */
	setBackgroundImage(
		options?: setBackgroundImageOptions
	): void
	/**
	  * [官方文档](https://developer.taobao.com/api/ui/ui-pulldown.html#my-removebackgroundimage)
	  *
	  * 删除页面背景
	  */
	removeBackgroundImage(
		options?: removeBackgroundImageOptions
	): void
	/**
	  * [官方文档](https://developer.taobao.com/api/ui/ui-pulldown.html#my-setviewtop)
	  *
	  * 设置 view 的初始位置，将整个 view 偏移到指定位置，可以用在下拉刷新和二楼效果中固定 view 位置
	  */
	setViewTop(
		options: setViewTopOptions
	): void
	/**
	  * [官方文档](https://developer.taobao.com/api/ui/ui-pulldown.html#my-setcanpulldown)
	  *
	  * 设置是否可以下拉
	  */
	setCanPullDown(
		options: setCanPullDownOptions
	): void
	/**
	  * [官方文档](https://developer.taobao.com/api/ui/ui-sku.html#my-showsku)
	  *
	  * 显示指定商品 SKU 选择器
	  */
	showSku(
		options: showSkuOptions
	): void
	/**
	  * [官方文档](https://developer.taobao.com/api/ui/ui-sku.html#my-hidesku)
	  *
	  * 隐藏正在展示的商品 SKU 选择器
	  */
	hideSku(
		options?: hideSkuOptions
	): void
	/**
	  * [官方文档](https://developer.taobao.com/api/ui/ui-tabbar.html#my-switchtab)
	  *
	  * 跳转到指定 tabBar 页面，并关闭其他所有非 tabBar 页面。
	  */
	switchTab(
		options: switchTabOptions
	): void
	/**
	  * [官方文档](https://developer.taobao.com/api/ui/ui-tabbar.html#my-showtabbar)
	  *
	  * 显示 TabBar
	  */
	showTabBar(
		options: showTabBarOptions
	): void
	/**
	  * [官方文档](https://developer.taobao.com/api/ui/ui-tabbar.html#my-hidetabbar)
	  *
	  * 隐藏 TabBar
	  */
	hideTabBar(
		options: hideTabBarOptions
	): void
	/**
	  * [官方文档](https://developer.taobao.com/api/ui/ui-tabbar.html#my-settabbarstyle)
	  *
	  * 设置TabBar的样式
	  */
	setTabBarStyle(
		options?: setTabBarStyleOptions
	): void
	/**
	  * [官方文档](https://developer.taobao.com/api/ui/ui-tabbar.html#my-settabbaritem)
	  *
	  * 设置 tabBar 某一项的内容
	  */
	setTabBarItem(
		options: setTabBarItemOptions
	): void
	/**
	  * [官方文档](https://developer.taobao.com/api/ui/ui-tabbar.html#my-settabbarbadge)
	  *
	  * 设置 tabBar 某一项的右上角的文本
	  */
	setTabBarBadge(
		options: setTabBarBadgeOptions
	): void
	/**
	  * [官方文档](https://developer.taobao.com/api/ui/ui-tabbar.html#my-removetabbarbadge)
	  *
	  * 移除 tabBar 某一项右上角的文本
	  */
	removeTabBarBadge(
		options: removeTabBarBadgeOptions
	): void
	/**
	  * [官方文档](https://developer.taobao.com/api/ui/ui-tabbar.html#my-showtabbarreddot)
	  *
	  * 显示 tabBar 某一项的右上角的红点
	  */
	showTabBarRedDot(
		options: showTabBarRedDotOptions
	): void
	/**
	  * [官方文档](https://developer.taobao.com/api/ui/ui-tabbar.html#my-hidetabbarreddot)
	  *
	  * 隐藏 tabBar 某一项的右上角的红点
	  */
	hideTabBarRedDot(
		options: hideTabBarRedDotOptions
	): void

	/**
	 * 退出当前小程序，必须通过点击事件触发才能调用成功。
	 */
	exitProgram();

	/** 
	 * 触发设备较短时间 (40 ms) 振动。
	 * type: 震动强度类型。若当前设备不支持设置震动等级，则会使用默认的强度去触发震动，不会触发报错
	 * 'heavy':强 'medium':中等 'light':弱
	 */
	vibrateShort(res: { type: 'heavy' | 'medium' | 'light' });

	/** 
	 * 触发设备较长时间 (400 ms) 振动。
	 */
	vibrateLong();

	/** 
	 * 
	 */
	getLaunchOptionsSync(): AliyMiniprogram.AppLaunchOptions;
	getEnterOptionsSync(): AliyMiniprogram.AppLaunchOptions;
	requestGamePayment(data: {
		customId: string,
		buyQuantity: number,
		extraInfo?: Record<string, any>,
		success?: (res: { resultCode: number }) => void,
		fail?: (res: CallBack.Fail) => void,
		complete?: () => void
	}): void;

	/** 监听小游戏回到前台的事件 */
	onShow(listener: (res: AliyMiniprogram.AppLaunchOptions) => void);
	/** 监听小游戏退到后台的事件 */
	onHide(listener: () => void);

	/** 取消监听小游戏回到前台的事件 onShow 中传入的监听函数，不传此参数则移除所有监听函数 */
	offShow(listener: () => void);
	/** 关闭小游戏退到后台的事件监听 onHide 传入的监听函数，不传此参数则移除所有监听函数。 */
	offHide(listener: () => void);

	/** my.showSharePanel 唤起支付宝分享面板 可以通过页面事件处理函数 page.onShareAppMessage 设置分享面板的分享信息或处理分享的回调事件*/
	showSharePanel(): void;
	/** 设置页面的分享信息，通过onShareAppMessage注册分享信息，当调用my.showSharePanel 或者点击分享面板的时候会调用 */
	onShareAppMessage: () => { title: string, desc: string, imageUrl };

	/** 监听小程序 JS 错误 */
	onError(listener: (err: Error) => void);

	/** 创建激励广告组件 */
	createRewardedAd(res: { adUnitId: ad_unitId, multiton: multiton }): AliyMiniprogram.RewardedAd;

	getAccountInfoSync(): AliyMiniprogram.AccountInfo;

	/** 将 Base64 字符串转成 ArrayBuffer 对象。基础库 2.7.3 或更高版本； 若版本较低，建议采取 兼容处理 。 */
	base64ToArrayBuffer(data: string): ArrayBuffer;
	/** 将 ArrayBuffer 对象转成 Base64 字符串。 基础库 2.7.3 或更高版本； 若版本较低，建议采取 兼容处理 。 */
	arrayBufferToBase64(buffer: ArrayBuffer): string;

	/** 获取游戏圈数据 */
	getGameClubData(data: {
		dataTypeList: { type: number }[],
		success: (res: { dataType: number, value: number }[]) => void,
		fail: (res: { error: number, errorMessage: string }) => void
	});

	/** 创建游戏圈按钮，游戏圈按钮被点击后会跳转到小游戏的游戏圈 */
	createGameClubButton(data: {
		type: "text" | "image", // 按钮类型
		text?: string,  // 按钮文案。注意：type=“text”时必填
		image?: string, // 自定义按钮背景图，注意：type=“image”有效，仅支持网络图片路径，配置以后icon字段将失效。
		icon?: "blue" | "white" | "dark" | "light"  // 按钮样式图标。注意:type="image" 且 "image" 字段未配置时有效
		openlink?: string, // 游戏圈传参数，进入到指定圈子下。该参数传游戏圈的圈子ID

		// 按钮样式
		style: {
			left: number, // 按钮离屏幕左边距
			top: number, // 按钮离屏幕上边距
			width: number, // 按钮宽度
			height: number, // 按钮高度
			backgroundColor?: string // 按钮背景颜色。该值为16进制字符串（Hex String）例："#ff0000"
			borderColor?: string, // 按钮边框颜色。该值为16进制字符串（Hex String）例："#ff0000"
			borderWidth?: number, // 按钮边框宽度
			borderRadius?: number, // 按钮圆角幅度
			color?: string, // 文案颜色，type=“text”有效，该值为16进制字符串（Hex String）例："#ff0000"
			fontSize?: number, // 文案字体大小，type=“text”有效
			textAlign?: any // 文案对齐方式，type=“text”有效
		}
	}): AliyMiniprogram.GameClubButton;

	gameBiz: {
		/**
		 * 报告游戏加载完成。
		 */
		reportLoadingCompleted(): void;

		/**
		 * 初次启动游戏时，默认授权或主动授权完成时进行上报。
		 */
		reportAuthorized(): void;

		/**
		 * 报告游戏角色创建完成。
		 * @param initial 是否是初次创建。
		 */
		reportGameCharacterCreated(initial: boolean): void;

		/**
		 * 报告成功进入游戏游玩界面。
		 */
		reportGamePlay(): void;


		reportCustomEvent(event: string, info: _PlainObject);
	}
}

/**
 * 全局注入变量
 */
declare var my: My

declare type _PlainObject = { [key: string]: any }
declare type _AnyFunction = (...args: any[]) => any
