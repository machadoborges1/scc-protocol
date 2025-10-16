import { PriceFeedUpdated } from "../../generated/OracleManager/OracleManager";
import { ChainlinkPriceFeed } from "../../generated/templates";
import { DataSourceContext, log } from "@graphprotocol/graph-ts";

export function handlePriceFeedUpdated(event: PriceFeedUpdated): void {
  log.info("handlePriceFeedUpdated triggered for asset: {}, feed: {}", [
    event.params.asset.toHexString(),
    event.params.feed.toHexString(),
  ]);

  const asset = event.params.asset;
  const feed = event.params.feed;

  let context = new DataSourceContext();
  context.setString("asset", asset.toHexString());

  ChainlinkPriceFeed.createWithContext(feed, context);

  log.info("ChainlinkPriceFeed dynamic data source created for feed: {}", [
    feed.toHexString(),
  ]);
}
