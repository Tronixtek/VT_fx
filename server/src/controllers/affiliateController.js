import AffiliateClick from '../models/AffiliateClick.js';

export const trackClick = async (req, res) => {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const referrer = req.headers['referer'] || req.headers['referrer'];

    await AffiliateClick.create({
      user: req.user?._id || null,
      ipAddress,
      userAgent,
      referrer,
    });

    // Redirect to Deriv affiliate link
    const derivUrl = process.env.DERIV_AFFILIATE_URL || 'https://track.deriv.com/';
    
    res.json({
      success: true,
      message: 'Click tracked successfully',
      redirectUrl: derivUrl,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to track click',
      error: error.message,
    });
  }
};

export const getAffiliateStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const query = {};
    if (startDate && endDate) {
      query.clickedAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const totalClicks = await AffiliateClick.countDocuments(query);
    const conversions = await AffiliateClick.countDocuments({
      ...query,
      converted: true,
    });

    const clicksByDate = await AffiliateClick.aggregate([
      { $match: query },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$clickedAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const topReferrers = await AffiliateClick.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$referrer',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    res.json({
      success: true,
      data: {
        totalClicks,
        conversions,
        conversionRate: totalClicks > 0 ? ((conversions / totalClicks) * 100).toFixed(2) : 0,
        clicksByDate,
        topReferrers,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch affiliate stats',
      error: error.message,
    });
  }
};

export const updateConversion = async (req, res) => {
  try {
    const { clickId } = req.body;

    const click = await AffiliateClick.findById(clickId);
    if (!click) {
      return res.status(404).json({
        success: false,
        message: 'Click not found',
      });
    }

    click.converted = true;
    click.conversionDate = new Date();
    await click.save();

    res.json({
      success: true,
      message: 'Conversion updated successfully',
      data: click,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update conversion',
      error: error.message,
    });
  }
};
